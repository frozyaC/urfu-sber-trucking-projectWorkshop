 package ru.urfu.testauth.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import ru.urfu.testauth.models.PassDTO;

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
                        .setMarginTop(10)
                        .setMarginBottom(5));

                if (driver.get("name") != null && !driver.get("name").toString().trim().isEmpty()) {
                    document.add(new Paragraph("ФИО: " + driver.get("name").toString()));
                }
                if (driver.get("licenseNumber") != null && !driver.get("licenseNumber").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Водительское удостоверение: " + driver.get("licenseNumber").toString()));
                }
                if (driver.get("phone") != null && !driver.get("phone").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Телефон: " + driver.get("phone").toString()));
                }
            }

            // Паспортные данные
            if (passDTO.getPassportData() != null) {
                Map<String, Object> passport = passDTO.getPassportData();
                document.add(new Paragraph("ПАСПОРТНЫЕ ДАННЫЕ:")
                        .setMarginTop(10)
                        .setMarginBottom(5));

                if (passport.get("fullName") != null && !passport.get("fullName").toString().trim().isEmpty()) {
                    document.add(new Paragraph("ФИО: " + passport.get("fullName").toString()));
                }
                if (passport.get("birthDate") != null && !passport.get("birthDate").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Дата рождения: " + formatDate(passport.get("birthDate").toString())));
                }
                String series = passport.get("series") != null ? passport.get("series").toString().trim() : "";
                String number = passport.get("number") != null ? passport.get("number").toString().trim() : "";
                if (!series.isEmpty() || !number.isEmpty()) {
                    document.add(new Paragraph("Серия и номер: " + series + " " + number));
                }
                if (passport.get("issuedBy") != null && !passport.get("issuedBy").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Кем выдан: " + passport.get("issuedBy").toString()));
                }
                if (passport.get("divisionCode") != null && !passport.get("divisionCode").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Код подразделения: " + passport.get("divisionCode").toString()));
                }
            }

            // Транспортное средство
            if (passDTO.getTruck() != null) {
                Map<String, Object> truck = passDTO.getTruck();
                document.add(new Paragraph("ТРАНСПОРТНОЕ СРЕДСТВО:")
                        .setMarginTop(10)
                        .setMarginBottom(5));

                String make = truck.get("make") != null ? truck.get("make").toString().trim() : "";
                String model = truck.get("model") != null ? truck.get("model").toString().trim() : "";
                if (!make.isEmpty() || !model.isEmpty()) {
                    document.add(new Paragraph("Марка/модель: " + make + " " + model));
                }
                if (truck.get("year") != null) {
                    document.add(new Paragraph("Год выпуска: " + truck.get("year").toString()));
                }
                if (truck.get("licensePlate") != null && !truck.get("licensePlate").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Гос. номер: " + truck.get("licensePlate").toString()));
                }
                if (truck.get("vinNumber") != null && !truck.get("vinNumber").toString().trim().isEmpty()) {
                    document.add(new Paragraph("VIN: " + truck.get("vinNumber").toString()));
                }
            }

            // Маршрут и груз
            if (passDTO.getOrder() != null) {
                Map<String, Object> order = passDTO.getOrder();
                document.add(new Paragraph("МАРШРУТ И ГРУЗ:")
                        .setMarginTop(10)
                        .setMarginBottom(5));

                if (order.get("origin") != null && !order.get("origin").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Откуда: " + order.get("origin").toString()));
                }
                if (order.get("destination") != null && !order.get("destination").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Куда: " + order.get("destination").toString()));
                }
                if (order.get("cargoType") != null && !order.get("cargoType").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Тип груза: " + order.get("cargoType").toString()));
                }
                if (order.get("weight") != null && !order.get("weight").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Вес: " + order.get("weight").toString()));
                }
                if (order.get("volume") != null && !order.get("volume").toString().trim().isEmpty()) {
                    document.add(new Paragraph("Объем: " + order.get("volume").toString()));
                }
            }

            // Срок действия
            document.add(new Paragraph("СРОК ДЕЙСТВИЯ:")
                    .setMarginTop(10)
                    .setMarginBottom(5));
            document.add(new Paragraph("Выдан: " + formatDate(passDTO.getIssueDate())));
            document.add(new Paragraph("Действует до: " + formatDate(passDTO.getValidUntil())));

            // Цель поездки
            document.add(new Paragraph("ЦЕЛЬ ПОЕЗДКИ:")
                    .setMarginTop(10)
                    .setMarginBottom(5));
            if (passDTO.getPurpose() != null && !passDTO.getPurpose().trim().isEmpty()) {
                document.add(new Paragraph(passDTO.getPurpose()));
            }

            // Описание маршрута
            if (passDTO.getRouteDescription() != null && !passDTO.getRouteDescription().trim().isEmpty()) {
                document.add(new Paragraph("ОПИСАНИЕ МАРШРУТА:")
                        .setMarginTop(10)
                        .setMarginBottom(5));
                document.add(new Paragraph(passDTO.getRouteDescription()));
            }

            // Дополнительные примечания
            if (passDTO.getAdditionalNotes() != null && !passDTO.getAdditionalNotes().trim().isEmpty()) {
                document.add(new Paragraph("ДОПОЛНИТЕЛЬНЫЕ ПРИМЕЧАНИЯ:")
                        .setMarginTop(10)
                        .setMarginBottom(5));
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

