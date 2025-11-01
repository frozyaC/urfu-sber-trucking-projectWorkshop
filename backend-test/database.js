const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

// Единый экземпляр базы данных
let dbInstance = null;

/**
 * Подключение к базе данных (синглтон)
 */
function getDatabase() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Ошибка подключения к БД:', err.message);
      } else {
        console.log('Подключено к SQLite БД');
      }
    });
  }
  return dbInstance;
}

/**
 * Инициализация базы данных - создание всех таблиц
 */
function initializeDatabase() {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Таблица пользователей
      db.run(`CREATE TABLE IF NOT EXISTS users (
        inn TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('shipper', 'logistician')),
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Ошибка создания таблицы users:', err.message);
          reject(err);
          return;
        }
      });

      // Таблица заказов
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        shipper_name TEXT NOT NULL,
        manager_name TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        origin_latitude TEXT,
        origin_longitude TEXT,
        destination_latitude TEXT,
        destination_longitude TEXT,
        trailer_type TEXT,
        volume TEXT,
        weight TEXT,
        pickup_date TEXT NOT NULL,
        pickup_time TEXT,
        delivery_date TEXT NOT NULL,
        delivery_time TEXT,
        transportation_cost REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Ожидает',
        cargo_type TEXT,
        special_requirements TEXT,
        length TEXT,
        width TEXT,
        height TEXT,
        assigned_driver_id TEXT,
        external_order_number TEXT,
        vehicle_count INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id)
      )`, (err) => {
        if (err) {
          console.error('Ошибка создания таблицы orders:', err.message);
          reject(err);
          return;
        }
      });

      // Индексы для orders
      db.run(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`, (err) => {
        if (err) console.error('Ошибка создания индекса idx_orders_status:', err.message);
      });
      db.run(`CREATE INDEX IF NOT EXISTS idx_orders_shipper ON orders(shipper_name)`, (err) => {
        if (err) console.error('Ошибка создания индекса idx_orders_shipper:', err.message);
      });
      db.run(`CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(assigned_driver_id)`, (err) => {
        if (err) console.error('Ошибка создания индекса idx_orders_driver:', err.message);
      });

      // Таблица водителей
      db.run(`CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        license_number TEXT UNIQUE NOT NULL,
        availability TEXT NOT NULL CHECK(availability IN ('Доступен', 'В рейсе', 'На ТО', 'Не работает')),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Ошибка создания таблицы drivers:', err.message);
          reject(err);
          return;
        }
      });

      // Таблица тягачей
      db.run(`CREATE TABLE IF NOT EXISTS trucks (
        id TEXT PRIMARY KEY,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        license_plate TEXT UNIQUE NOT NULL,
        vin_number TEXT UNIQUE NOT NULL,
        maintenance_status TEXT NOT NULL CHECK(maintenance_status IN ('Исправен', 'Требует ТО', 'На ТО')),
        current_location TEXT NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Ошибка создания таблицы trucks:', err.message);
          reject(err);
          return;
        }
      });

      // Таблица прицепов
      db.run(`CREATE TABLE IF NOT EXISTS trailers (
        id TEXT PRIMARY KEY,
        license_plate TEXT UNIQUE NOT NULL,
        trailer_type TEXT NOT NULL,
        length TEXT NOT NULL,
        width TEXT NOT NULL,
        height TEXT NOT NULL,
        volume TEXT NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Ошибка создания таблицы trailers:', err.message);
          reject(err);
          return;
        }
      });

      // Таблица связок автопарка
      db.run(`CREATE TABLE IF NOT EXISTS fleet_assignments (
        id TEXT PRIMARY KEY,
        driver_id TEXT NOT NULL,
        truck_id TEXT NOT NULL,
        trailer_id TEXT NOT NULL,
        assigned_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id),
        FOREIGN KEY (truck_id) REFERENCES trucks(id),
        FOREIGN KEY (trailer_id) REFERENCES trailers(id),
        UNIQUE (driver_id, truck_id, trailer_id)
      )`, (err) => {
        if (err) {
          console.error('Ошибка создания таблицы fleet_assignments:', err.message);
          reject(err);
          return;
        }
      });

      // Вставка тестовых пользователей (если их еще нет)
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          console.error('Ошибка проверки пользователей:', err.message);
          reject(err);
          return;
        }

        if (row.count === 0) {
          const testUsers = [
            { inn: '7701234567', name: 'Иван Иванов', company: 'ООО "МеталлСтрой"', userType: 'shipper', password: 'shipper123' },
            { inn: '7709876543', name: 'Петр Петров', company: 'ООО "ЛогистикПро"', userType: 'logistician', password: 'logist123' },
            { inn: 'demo', name: 'Демо пользователь', company: 'Демо компания', userType: 'shipper', password: 'demo' }
          ];

          const stmt = db.prepare(`INSERT INTO users (inn, name, company, user_type, password) 
            VALUES (?, ?, ?, ?, ?)`);
          
          testUsers.forEach(user => {
            stmt.run(user.inn, user.name, user.company, user.userType, user.password);
          });
          
          stmt.finalize((err) => {
            if (err) {
              console.error('Ошибка вставки тестовых пользователей:', err.message);
              reject(err);
              return;
            }
            console.log('Тестовые пользователи созданы');
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * CRUD операции для пользователей
 */
const UserDB = {
  /**
   * Поиск пользователя по ИНН и паролю (для авторизации)
   */
  findByInnAndPassword(inn, password) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT inn, name, company, user_type as userType FROM users WHERE inn = ? AND password = ?',
        [inn, password],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  },

  /**
   * Поиск пользователя по ИНН
   */
  findByInn(inn) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT inn, name, company, user_type as userType FROM users WHERE inn = ?',
        [inn],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  },

  /**
   * Создание нового пользователя (регистрация)
   */
  create(user) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (inn, name, company, user_type, password) 
         VALUES (?, ?, ?, ?, ?)`,
        [user.inn, user.name || '', user.company, user.userType, user.password],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              inn: user.inn,
              name: user.name || '',
              company: user.company,
              userType: user.userType
            });
          }
        }
      );
    });
  }
};

/**
 * CRUD операции для заказов
 */
const OrderDB = {
  /**
   * Получить максимальный числовой ID заказа
   * Используется для генерации нового ID по порядку
   */
  getMaxOrderId() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT id FROM orders', [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Находим максимальный числовой ID
        let maxId = 0;
        rows.forEach(row => {
          const numId = parseInt(row.id);
          if (!isNaN(numId) && numId > maxId) {
            maxId = numId;
          }
        });
        
        resolve(maxId);
      });
    });
  },

  /**
   * Создание нового заказа
   * ID генерируется автоматически как максимальный существующий ID + 1
   */
  async create(order) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      // Получаем максимальный ID и генерируем новый
      OrderDB.getMaxOrderId()
        .then(maxId => {
          const newOrderId = String(maxId + 1);
          
          db.run(
            `INSERT INTO orders (
              id, shipper_name, manager_name, origin, destination,
              origin_latitude, origin_longitude, destination_latitude, destination_longitude,
              trailer_type, volume, weight, pickup_date, pickup_time,
              delivery_date, delivery_time, transportation_cost, status,
              cargo_type, special_requirements, length, width, height,
              assigned_driver_id, external_order_number, vehicle_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newOrderId,
              order.shipperName,
              order.managerName,
              order.origin,
              order.destination,
              order.originLatitude || null,
              order.originLongitude || null,
              order.destinationLatitude || null,
              order.destinationLongitude || null,
              order.trailerType || null,
              order.volume || null,
              order.weight || null,
              order.pickupDate,
              order.pickupTime || null,
              order.deliveryDate,
              order.deliveryTime || null,
              order.transportationCost,
              order.status || 'Ожидает',
              order.cargoType || null,
              order.specialRequirements || '',
              order.length || null,
              order.width || null,
              order.height || null,
              order.assignedDriverId || null,
              order.externalOrderNumber || null,
              order.vehicleCount || 1
            ],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // Возвращаем созданный заказ
                OrderDB.findById(newOrderId)
                  .then(resolve)
                  .catch(reject);
              }
            }
          );
        })
        .catch(reject);
    });
  },

  /**
   * Поиск заказа по ID
   */
  findById(orderId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          id, shipper_name as shipperName, manager_name as managerName,
          origin, destination, origin_latitude as originLatitude,
          origin_longitude as originLongitude, destination_latitude as destinationLatitude,
          destination_longitude as destinationLongitude, trailer_type as trailerType,
          volume, weight, pickup_date as pickupDate, pickup_time as pickupTime,
          delivery_date as deliveryDate, delivery_time as deliveryTime,
          transportation_cost as transportationCost, status, cargo_type as cargoType,
          special_requirements as specialRequirements, length, width, height,
          assigned_driver_id as assignedDriverId, external_order_number as externalOrderNumber,
          vehicle_count as vehicleCount, created_at as createdAt
        FROM orders WHERE id = ?`,
        [orderId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  },

  /**
   * Получить все заказы
   */
  findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, shipper_name as shipperName, manager_name as managerName,
          origin, destination, origin_latitude as originLatitude,
          origin_longitude as originLongitude, destination_latitude as destinationLatitude,
          destination_longitude as destinationLongitude, trailer_type as trailerType,
          volume, weight, pickup_date as pickupDate, pickup_time as pickupTime,
          delivery_date as deliveryDate, delivery_time as deliveryTime,
          transportation_cost as transportationCost, status, cargo_type as cargoType,
          special_requirements as specialRequirements, length, width, height,
          assigned_driver_id as assignedDriverId, external_order_number as externalOrderNumber,
          vehicle_count as vehicleCount, created_at as createdAt
        FROM orders ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  },

  /**
   * Получить заказы по имени грузоотправителя
   */
  findByShipperName(shipperName) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, shipper_name as shipperName, manager_name as managerName,
          origin, destination, origin_latitude as originLatitude,
          origin_longitude as originLongitude, destination_latitude as destinationLatitude,
          destination_longitude as destinationLongitude, trailer_type as trailerType,
          volume, weight, pickup_date as pickupDate, pickup_time as pickupTime,
          delivery_date as deliveryDate, delivery_time as deliveryTime,
          transportation_cost as transportationCost, status, cargo_type as cargoType,
          special_requirements as specialRequirements, length, width, height,
          assigned_driver_id as assignedDriverId, external_order_number as externalOrderNumber,
          vehicle_count as vehicleCount, created_at as createdAt
        FROM orders WHERE shipper_name = ? ORDER BY created_at DESC`,
        [shipperName],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  },

  /**
   * Удаление заказа из БД
   */
  delete(orderId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM orders WHERE id = ?', [orderId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  },

  /**
   * Обновление статуса заказа
   */
  updateStatus(orderId, status) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], function(err) {
        if (err) {
          reject(err);
        } else {
          OrderDB.findById(orderId)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  },

  /**
   * Назначение водителя на заказ
   */
  assignDriver(orderId, driverId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE orders SET assigned_driver_id = ?, status = ? WHERE id = ?',
        [driverId, 'Назначен', orderId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            OrderDB.findById(orderId)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  }
};

/**
 * CRUD операции для водителей
 */
const DriverDB = {
  /**
   * Получить максимальный числовой ID водителя (из формата ВОД-XXX)
   */
  getMaxDriverId() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT id FROM drivers', [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        let maxNum = 0;
        rows.forEach(row => {
          // Извлекаем число из формата ВОД-XXX
          const match = row.id.match(/ВОД-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        
        resolve(maxNum);
      });
    });
  },

  /**
   * Создание нового водителя
   */
  async create(driver) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      DriverDB.getMaxDriverId()
        .then(maxNum => {
          const newId = `ВОД-${String(maxNum + 1).padStart(3, '0')}`;
          
          db.run(
            `INSERT INTO drivers (id, name, phone, license_number, availability, comment)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newId,
              driver.name,
              driver.phone,
              driver.licenseNumber,
              driver.availability,
              driver.comment || null
            ],
            function(err) {
              if (err) {
                reject(err);
              } else {
                DriverDB.findById(newId)
                  .then(resolve)
                  .catch(reject);
              }
            }
          );
        })
        .catch(reject);
    });
  },

  /**
   * Получить всех водителей
   */
  findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, name, phone, license_number as licenseNumber,
          availability, comment
        FROM drivers ORDER BY id`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  },

  /**
   * Поиск водителя по ID
   */
  findById(driverId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          id, name, phone, license_number as licenseNumber,
          availability, comment
        FROM drivers WHERE id = ?`,
        [driverId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  },

  /**
   * Обновление данных водителя
   */
  update(driverId, updates) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.phone !== undefined) {
        fields.push('phone = ?');
        values.push(updates.phone);
      }
      if (updates.licenseNumber !== undefined) {
        fields.push('license_number = ?');
        values.push(updates.licenseNumber);
      }
      if (updates.availability !== undefined) {
        fields.push('availability = ?');
        values.push(updates.availability);
      }
      if (updates.comment !== undefined) {
        fields.push('comment = ?');
        values.push(updates.comment);
      }
      
      if (fields.length === 0) {
        resolve(null);
        return;
      }
      
      values.push(driverId);
      db.run(
        `UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            reject(err);
          } else {
            DriverDB.findById(driverId)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  },

  /**
   * Удаление водителя
   */
  delete(driverId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM drivers WHERE id = ?', [driverId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
};

/**
 * CRUD операции для тягачей
 */
const TruckDB = {
  /**
   * Получить максимальный числовой ID тягача (из формата АВТ-XXX)
   */
  getMaxTruckId() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT id FROM trucks', [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        let maxNum = 0;
        rows.forEach(row => {
          const match = row.id.match(/АВТ-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        
        resolve(maxNum);
      });
    });
  },

  /**
   * Создание нового тягача
   */
  async create(truck) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      TruckDB.getMaxTruckId()
        .then(maxNum => {
          const newId = `АВТ-${String(maxNum + 1).padStart(3, '0')}`;
          
          db.run(
            `INSERT INTO trucks (
              id, make, model, year, license_plate, vin_number,
              maintenance_status, current_location, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              truck.make,
              truck.model,
              truck.year,
              truck.licensePlate,
              truck.vinNumber,
              truck.maintenanceStatus,
              truck.currentLocation,
              truck.comment || null
            ],
            function(err) {
              if (err) {
                reject(err);
              } else {
                TruckDB.findById(newId)
                  .then(resolve)
                  .catch(reject);
              }
            }
          );
        })
        .catch(reject);
    });
  },

  /**
   * Получить все тягачи
   */
  findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, make, model, year, license_plate as licensePlate,
          vin_number as vinNumber, maintenance_status as maintenanceStatus,
          current_location as currentLocation, comment
        FROM trucks ORDER BY id`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  },

  /**
   * Поиск тягача по ID
   */
  findById(truckId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          id, make, model, year, license_plate as licensePlate,
          vin_number as vinNumber, maintenance_status as maintenanceStatus,
          current_location as currentLocation, comment
        FROM trucks WHERE id = ?`,
        [truckId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  },

  /**
   * Обновление данных тягача
   */
  update(truckId, updates) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      if (updates.make !== undefined) { fields.push('make = ?'); values.push(updates.make); }
      if (updates.model !== undefined) { fields.push('model = ?'); values.push(updates.model); }
      if (updates.year !== undefined) { fields.push('year = ?'); values.push(updates.year); }
      if (updates.licensePlate !== undefined) { fields.push('license_plate = ?'); values.push(updates.licensePlate); }
      if (updates.vinNumber !== undefined) { fields.push('vin_number = ?'); values.push(updates.vinNumber); }
      if (updates.maintenanceStatus !== undefined) { fields.push('maintenance_status = ?'); values.push(updates.maintenanceStatus); }
      if (updates.currentLocation !== undefined) { fields.push('current_location = ?'); values.push(updates.currentLocation); }
      if (updates.comment !== undefined) { fields.push('comment = ?'); values.push(updates.comment); }
      
      if (fields.length === 0) {
        resolve(null);
        return;
      }
      
      values.push(truckId);
      db.run(
        `UPDATE trucks SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            reject(err);
          } else {
            TruckDB.findById(truckId)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  },

  /**
   * Удаление тягача
   */
  delete(truckId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM trucks WHERE id = ?', [truckId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
};

/**
 * CRUD операции для прицепов
 */
const TrailerDB = {
  /**
   * Получить максимальный числовой ID прицепа (из формата ПРЦ-XXX)
   */
  getMaxTrailerId() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT id FROM trailers', [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        let maxNum = 0;
        rows.forEach(row => {
          const match = row.id.match(/ПРЦ-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        
        resolve(maxNum);
      });
    });
  },

  /**
   * Создание нового прицепа
   */
  async create(trailer) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      TrailerDB.getMaxTrailerId()
        .then(maxNum => {
          const newId = `ПРЦ-${String(maxNum + 1).padStart(3, '0')}`;
          
          db.run(
            `INSERT INTO trailers (
              id, license_plate, trailer_type, length, width, height, volume, comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              trailer.licensePlate,
              trailer.trailerType,
              trailer.length,
              trailer.width,
              trailer.height,
              trailer.volume,
              trailer.comment || null
            ],
            function(err) {
              if (err) {
                reject(err);
              } else {
                TrailerDB.findById(newId)
                  .then(resolve)
                  .catch(reject);
              }
            }
          );
        })
        .catch(reject);
    });
  },

  /**
   * Получить все прицепы
   */
  findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, license_plate as licensePlate, trailer_type as trailerType,
          length, width, height, volume, comment
        FROM trailers ORDER BY id`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  },

  /**
   * Поиск прицепа по ID
   */
  findById(trailerId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          id, license_plate as licensePlate, trailer_type as trailerType,
          length, width, height, volume, comment
        FROM trailers WHERE id = ?`,
        [trailerId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  },

  /**
   * Обновление данных прицепа
   */
  update(trailerId, updates) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      if (updates.licensePlate !== undefined) { fields.push('license_plate = ?'); values.push(updates.licensePlate); }
      if (updates.trailerType !== undefined) { fields.push('trailer_type = ?'); values.push(updates.trailerType); }
      if (updates.length !== undefined) { fields.push('length = ?'); values.push(updates.length); }
      if (updates.width !== undefined) { fields.push('width = ?'); values.push(updates.width); }
      if (updates.height !== undefined) { fields.push('height = ?'); values.push(updates.height); }
      if (updates.volume !== undefined) { fields.push('volume = ?'); values.push(updates.volume); }
      if (updates.comment !== undefined) { fields.push('comment = ?'); values.push(updates.comment); }
      
      if (fields.length === 0) {
        resolve(null);
        return;
      }
      
      values.push(trailerId);
      db.run(
        `UPDATE trailers SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            reject(err);
          } else {
            TrailerDB.findById(trailerId)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  },

  /**
   * Удаление прицепа
   */
  delete(trailerId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM trailers WHERE id = ?', [trailerId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
};

/**
 * CRUD операции для связок автопарка
 */
const FleetAssignmentDB = {
  /**
   * Получить максимальный числовой ID связки (из формата СВЗ-XXX)
   */
  getMaxAssignmentId() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT id FROM fleet_assignments', [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        let maxNum = 0;
        rows.forEach(row => {
          const match = row.id.match(/СВЗ-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        
        resolve(maxNum);
      });
    });
  },

  /**
   * Создание новой связки автопарка
   */
  async create(assignment) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      FleetAssignmentDB.getMaxAssignmentId()
        .then(maxNum => {
          const newId = `СВЗ-${String(maxNum + 1).padStart(3, '0')}`;
          
          db.run(
            `INSERT INTO fleet_assignments (id, driver_id, truck_id, trailer_id, assigned_date)
             VALUES (?, ?, ?, ?, ?)`,
            [
              newId,
              assignment.driverId,
              assignment.truckId,
              assignment.trailerId,
              assignment.assignedDate
            ],
            function(err) {
              if (err) {
                reject(err);
              } else {
                FleetAssignmentDB.findById(newId)
                  .then(resolve)
                  .catch(reject);
              }
            }
          );
        })
        .catch(reject);
    });
  },

  /**
   * Получить все связки
   */
  findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, driver_id as driverId, truck_id as truckId,
          trailer_id as trailerId, assigned_date as assignedDate
        FROM fleet_assignments ORDER BY id`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  },

  /**
   * Поиск связки по ID
   */
  findById(assignmentId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          id, driver_id as driverId, truck_id as truckId,
          trailer_id as trailerId, assigned_date as assignedDate
        FROM fleet_assignments WHERE id = ?`,
        [assignmentId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  },

  /**
   * Удаление связки
   */
  delete(assignmentId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM fleet_assignments WHERE id = ?', [assignmentId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
};

module.exports = {
  getDatabase,
  initializeDatabase,
  UserDB,
  OrderDB,
  DriverDB,
  TruckDB,
  TrailerDB,
  FleetAssignmentDB
};
