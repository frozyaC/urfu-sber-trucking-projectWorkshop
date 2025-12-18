package ru.urfu.authtrucking.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import ru.urfu.authtrucking.dto.PassDTO;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;

@Service
@Slf4j
public class PassService {

    private final JavaMailSender mailSender;

    @Autowired
    public PassService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Генерация PDF документа для пропуска
     */
    public byte[] generatePassPdf(PassDTO passDTO) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        try {
            // Заголовок
            Paragraph title = new Paragraph("ПРОПУСК ДЛЯ ГРУЗОВОГО ТРАНСПОРТА")
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(10);
            document.add(title);

            Paragraph passNumber = new Paragraph("№ " + passDTO.getPassNumber())
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(passNumber);

            // Информация о водителе
            if (passDTO.getDriver() != null) {
                Map<String, Object> driver = passDTO.getDriver();
                document.add(new Paragraph("ИНФОРМАЦИЯ О ВОДИТЕЛЕ:")
                        .setMarginTop(10));

                if (driver.get("name") != null) {
                    document.add(new Paragraph("ФИО: " + driver.get("name")));
                }
                if (driver.get("licenseNumber") != null) {
                    document.add(new Paragraph("Водительское удостоверение: " + driver.get("licenseNumber")));
                }
                if (driver.get("phone") != null) {
                    document.add(new Paragraph("Телефон: " + driver.get("phone")));
                }
            }

            // Паспортные данные
            if (passDTO.getPassportData() != null) {
                Map<String, Object> passport = passDTO.getPassportData();
                document.add(new Paragraph("ПАСПОРТНЫЕ ДАННЫЕ:")
                        .setMarginTop(10));

                if (passport.get("fullName") != null) {
                    document.add(new Paragraph("ФИО: " + passport.get("fullName")));
                }
                if (passport.get("birthDate") != null) {
                    document.add(new Paragraph("Дата рождения: " + formatDate(passport.get("birthDate").toString())));
                }
                if (passport.get("series") != null || passport.get("number") != null) {
                    String series = passport.get("series") != null ? passport.get("series").toString() : "";
                    String number = passport.get("number") != null ? passport.get("number").toString() : "";
                    document.add(new Paragraph("Серия и номер: " + series + " " + number));
                }
                if (passport.get("issuedBy") != null) {
                    document.add(new Paragraph("Кем выдан: " + passport.get("issuedBy")));
                }
                if (passport.get("divisionCode") != null) {
                    document.add(new Paragraph("Код подразделения: " + passport.get("divisionCode")));
                }
            }

            // Транспортное средство
            if (passDTO.getTruck() != null) {
                Map<String, Object> truck = passDTO.getTruck();
                document.add(new Paragraph("ТРАНСПОРТНОЕ СРЕДСТВО:")
                        .setMarginTop(10));

                if (truck.get("make") != null && truck.get("model") != null) {
                    document.add(new Paragraph("Марка/модель: " + truck.get("make") + " " + truck.get("model")));
                }
                if (truck.get("year") != null) {
                    document.add(new Paragraph("Год выпуска: " + truck.get("year")));
                }
                if (truck.get("licensePlate") != null) {
                    document.add(new Paragraph("Гос. номер: " + truck.get("licensePlate")));
                }
                if (truck.get("vinNumber") != null) {
                    document.add(new Paragraph("VIN: " + truck.get("vinNumber")));
                }
            }

            // Маршрут и груз
            if (passDTO.getOrder() != null) {
                Map<String, Object> order = passDTO.getOrder();
                document.add(new Paragraph("МАРШРУТ И ГРУЗ:")
                        .setMarginTop(10));

                if (order.get("origin") != null) {
                    document.add(new Paragraph("Откуда: " + order.get("origin")));
                }
                if (order.get("destination") != null) {
                    document.add(new Paragraph("Куда: " + order.get("destination")));
                }
                if (order.get("cargoType") != null) {
                    document.add(new Paragraph("Тип груза: " + order.get("cargoType")));
                }
                if (order.get("weight") != null) {
                    document.add(new Paragraph("Вес: " + order.get("weight")));
                }
                if (order.get("volume") != null) {
                    document.add(new Paragraph("Объем: " + order.get("volume")));
                }
            }

            // Срок действия
            document.add(new Paragraph("СРОК ДЕЙСТВИЯ:")
                    .setMarginTop(10));
            document.add(new Paragraph("Выдан: " + formatDate(passDTO.getIssueDate())));
            document.add(new Paragraph("Действует до: " + formatDate(passDTO.getValidUntil())));

            // Цель поездки
            document.add(new Paragraph("ЦЕЛЬ ПОЕЗДКИ:")
                    .setMarginTop(10));
            document.add(new Paragraph(passDTO.getPurpose()));

            // Описание маршрута
            if (passDTO.getRouteDescription() != null && !passDTO.getRouteDescription().isEmpty()) {
                document.add(new Paragraph("ОПИСАНИЕ МАРШРУТА:")
                        .setMarginTop(10));
                document.add(new Paragraph(passDTO.getRouteDescription()));
            }

            // Дополнительные примечания
            if (passDTO.getAdditionalNotes() != null && !passDTO.getAdditionalNotes().isEmpty()) {
                document.add(new Paragraph("ДОПОЛНИТЕЛЬНЫЕ ПРИМЕЧАНИЯ:")
                        .setMarginTop(10));
                document.add(new Paragraph(passDTO.getAdditionalNotes()));
            }

            // Подпись
            document.add(new Paragraph("\n\nВыдан: " + formatDate(new Date()))
                    .setMarginTop(20));
            document.add(new Paragraph("Система управления логистикой"));
            document.add(new Paragraph("\nПодпись: _________________"));
            document.add(new Paragraph("М.П."));

        } finally {
            document.close();
        }

        return baos.toByteArray();
    }

    /**
     * Отправка PDF документа на email
     */
    public void sendPassByEmail(PassDTO passDTO, byte[] pdfBytes) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(passDTO.getEmail());
        helper.setSubject("Пропуск для грузового транспорта № " + passDTO.getPassNumber());
        helper.setText("Уважаемый пользователь,\n\n" +
                "Во вложении находится пропуск для грузового транспорта № " + passDTO.getPassNumber() + ".\n\n" +
                "С уважением,\nСистема управления логистикой");

        helper.addAttachment("pass_" + passDTO.getPassNumber() + ".pdf", new ByteArrayResource(pdfBytes));

        mailSender.send(message);
        log.info("Пропуск отправлен на email: {}", passDTO.getEmail());
    }

    /**
     * Форматирование даты для отображения
     */
    private String formatDate(String dateStr) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd");
            SimpleDateFormat outputFormat = new SimpleDateFormat("dd.MM.yyyy");
            Date date = inputFormat.parse(dateStr);
            return outputFormat.format(date);
        } catch (ParseException e) {
            return dateStr;
        }
    }

    private String formatDate(Date date) {
        SimpleDateFormat format = new SimpleDateFormat("dd.MM.yyyy");
        return format.format(date);
    }
}

