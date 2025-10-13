// server/setupDatabase.js

const path = require('path');
// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '.env') });


// إعداد اتصال قاعدة البيانات
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  // Example DATABASE_URL in .env file:
  // DATABASE_URL="postgresql://user:password@localhost:5432/assessment_db"
});

// Helper to create a standard test result table
const createTestTable = async (tableName, specificColumns) => {
    const hasTable = await knex.schema.hasTable(tableName);
    if (!hasTable) {
        console.log(`🚧 Creating table ${tableName}...`);
        await knex.schema.createTable(tableName, (table) => {
            table.increments('id').primary();
            table.string('schoolNationalId').notNullable();
            table.integer('year').notNullable();
            table.string('subject').notNullable();
            table.float('score').notNullable();
            
            // Add any specific columns for this test type
            if (specificColumns) {
                specificColumns(table);
            }

            table.timestamp('dateAdded').defaultTo(knex.fn.now());
        });
        console.log(`✅ Table ${tableName} created successfully!`);
    } else {
        console.log(`👍 Table ${tableName} already exists.`);
    }
};


// دالة لإعداد قاعدة البيانات
async function setupDatabase() {
  try {
    console.log('🔄 جاري التحقق من وجود جدول المدارس...');
    const hasSchoolsTable = await knex.schema.hasTable('schools');

    if (!hasSchoolsTable) {
      console.log('🚧 جدول المدارس غير موجود، سيتم إنشاؤه الآن...');
      await knex.schema.createTable('schools', (table) => {
        table.increments('id').primary();
        table.string('schoolNameAr').notNullable();
        table.string('schoolNameEn');
        table.string('schoolId');
        table.string('nationalId').notNullable().unique();
        table.string('region');
        table.string('principalName').notNullable();
        table.string('principalEmail');
        table.string('principalPhone');
        table.string('highestGrade');
        table.string('lowestGrade');
        table.string('schoolGender');
        table.string('buildingType');
        table.boolean('isCamp');
        table.timestamp('dateAdded').defaultTo(knex.fn.now());
      });
      console.log('✅ تم إنشاء جدول المدارس بنجاح!');
    } else {
      console.log('👍 جدول المدارس موجود بالفعل.');
    }

    // Create all test result tables
    await createTestTable('timssResults', table => table.string('grade').notNullable());
    await createTestTable('pisaResults'); // No extra columns
    await createTestTable('pirlsResults'); // No extra columns
    await createTestTable('nationalTestResults', table => table.string('grade').notNullable());
    await createTestTable('assessmentTestResults'); // No extra columns
    await createTestTable('unifiedTestResults', table => {
        table.string('grade').notNullable();
        table.string('semester').notNullable();
    });
    await createTestTable('literacyNumeracyResults', table => table.string('grade').notNullable());
    await createTestTable('aloResults', table => {
        table.string('grade').notNullable();
        table.float('participationRate');
        table.float('achievedRate');
        table.float('partiallyAchievedRate');
        table.float('notAchievedRate');
    });

    console.log('🔄 Checking for managed_users table...');
    const hasUsersTable = await knex.schema.hasTable('managed_users');
    if (!hasUsersTable) {
        console.log('🚧 Creating managed_users table...');
        await knex.schema.createTable('managed_users', table => {
            table.increments('id').primary();
            table.string('username').notNullable().unique();
            table.string('password').notNullable();
            table.enum('role', ['admin', 'manager', 'supervisor']).notNullable();
            table.timestamp('dateAdded').defaultTo(knex.fn.now());
        });
        console.log('✅ Table managed_users created successfully!');
    } else {
        console.log('👍 Table managed_users already exists.');
    }

    // **FIX: Separate logic to ensure the admin user always exists.**
    // This now runs regardless of whether the table was just created or already existed.
    console.log('🔄 Checking for initial admin user...');
    const adminUser = await knex('managed_users').where({ username: 'admin' }).first();
    if (!adminUser) {
        console.log('🌱 Seeding initial admin user...');
        await knex('managed_users').insert({
            username: 'admin',
            password: 'admin123', // In a real app, this MUST be hashed
            role: 'admin',
        });
        console.log('🌳 Initial admin user seeded.');
    } else {
        console.log('👍 Initial admin user already exists.');
    }


    console.log('🎉 إعداد قاعدة البيانات اكتمل بنجاح.');

  } catch (error) {
    console.error('❌ حدث خطأ أثناء إعداد قاعدة البيانات:', error);
  } finally {
    // إغلاق الاتصال بقاعدة البيانات
    await knex.destroy();
  }
}

// تشغيل دالة الإعداد
setupDatabase();