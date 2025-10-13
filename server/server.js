// server/server.js

const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = 4000;

// FIX: Increase the JSON payload limit to handle larger Excel file imports.
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// --- AUTH API ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const foundUser = await knex('managed_users').where({ username, password }).first();
        if (!foundUser) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
        }

        if (foundUser.role === 'admin') {
            res.json({ id: foundUser.id, username: 'مسؤول النظام', role: 'admin' });
        } else if (foundUser.role === 'supervisor') {
            res.json({ id: foundUser.id, username: `مشرف (${foundUser.username})`, role: 'supervisor' });
        } else if (foundUser.role === 'manager') {
            const schoolId = foundUser.username;
            const school = await knex('schools').where({ nationalId: schoolId }).first();
            if (school) {
                res.json({ id: foundUser.id, username: school.schoolNameAr, role: 'manager', schoolId });
            } else {
                res.json({ id: foundUser.id, username: "مدير جديد", role: 'manager', schoolId, isNew: true });
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم أثناء تسجيل الدخول.' });
    }
});


// --- USER MANAGEMENT API ---

app.post('/api/users/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    try {
        const user = await knex('managed_users').where({ id: userId }).first();
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود.' });
        }
        if (user.password !== currentPassword) {
            return res.status(403).json({ message: 'كلمة المرور الحالية غير صحيحة.' });
        }
        await knex('managed_users').where({ id: userId }).update({ password: newPassword });
        res.json({ message: 'تم تغيير كلمة المرور بنجاح.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم.' });
    }
});


app.get('/api/managedUsers', async (req, res) => {
    try {
        const users = await knex('managed_users').select('id', 'username', 'role', 'dateAdded').orderBy('id', 'desc');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/managedUsers', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const [newUser] = await knex('managed_users').insert({ username, password, role }).returning(['id', 'username', 'role', 'dateAdded']);
        res.status(201).json(newUser);
    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ message: `اسم المستخدم '${username}' موجود بالفعل.`});
        }
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/managedUsers/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body; // Only password can be updated this way now
    
    if (!password) {
        // If no password, it means we don't need to update anything from this form.
        // We can just return the existing user data.
        const user = await knex('managed_users').where({ id }).first('id', 'username', 'role', 'dateAdded');
        return res.json(user);
    }

    try {
        const [updatedUser] = await knex('managed_users').where({ id }).update({ password }).returning(['id', 'username', 'role', 'dateAdded']);
        if (!updatedUser) return res.status(404).json({ message: 'المستخدم غير موجود.' });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/managedUsers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await knex('managed_users').where({ id }).del();
        if (count === 0) return res.status(404).json({ message: 'المستخدم غير موجود.' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// دالة مساعدة لتحويل قيمة isCamp
const mapSchoolData = (school) => ({
    ...school,
    isCamp: !!school.isCamp, // تحويل 0/1 أو false/true إلى boolean
});

// --- SCHOOLS API ---

// [GET] جلب كل المدارس
app.get('/api/schools', async (req, res) => {
    console.log('GET request to /api/schools');
    try {
        const schools = await knex('schools').select('*').orderBy('id', 'desc');
        res.json(schools.map(mapSchoolData));
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ message: `خطأ في الخادم عند جلب المدارس: ${error.message}` });
    }
});

// [POST] إضافة مدرسة جديدة
app.post('/api/schools', async (req, res) => {
    try {
        const newSchoolData = req.body;
        console.log('POST request to /api/schools with data:', newSchoolData);

        const [addedSchool] = await knex('schools').insert(newSchoolData).returning('*');

        res.status(201).json(mapSchoolData(addedSchool));
    } catch (error) {
        console.error('Error adding school:', error);
         if (error.code === '23505') { // Unique constraint violation for nationalId
            return res.status(409).json({ message: `الرقم الوطني '${req.body.nationalId}' مسجل لمدرسة أخرى.`});
        }
        res.status(500).json({ message: `خطأ في الخادم عند إضافة المدرسة: ${error.message}` });
    }
});

// [POST] إضافة مدارس متعددة (دفعة واحدة)
app.post('/api/schools/batch', async (req, res) => {
    const trx = await knex.transaction();
    try {
        const schools = req.body;
        if (!Array.isArray(schools) || schools.length === 0) {
            await trx.rollback();
            return res.status(400).json({ message: 'البيانات المرسلة يجب أن تكون مصفوفة غير فارغة.' });
        }
        
        const chunkSize = 100;
        for (let i = 0; i < schools.length; i += chunkSize) {
            const chunk = schools.slice(i, i + chunkSize);
            await trx('schools').insert(chunk);
        }

        await trx.commit();
        res.status(201).json({ message: `تمت إضافة ${schools.length} مدرسة بنجاح.` });
    } catch (error) {
        await trx.rollback();
        console.error('Error batch adding schools:', error);
        if (error.code === '23505') { // Unique constraint violation for nationalId
            return res.status(409).json({ message: `فشل الاستيراد. أحد السجلات يحتوي على رقم وطني موجود بالفعل في النظام.`});
        }
        res.status(500).json({ message: `خطأ في الخادم عند إضافة المدارس: ${error.message}` });
    }
});


// [PUT] تعديل بيانات مدرسة موجودة بناءً على الـ ID
app.put('/api/schools/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    console.log(`PUT request to /api/schools/${id} with data:`, updatedData);

    try {
        const [updatedSchool] = await knex('schools').where({ id: id }).update(updatedData).returning('*');
        
        if (!updatedSchool) {
            return res.status(404).json({ message: 'المدرسة غير موجودة.' });
        }
        
        res.json(mapSchoolData(updatedSchool));

    } catch (error) {
        console.error('Error updating school:', error);
        res.status(500).json({ message: `خطأ في الخادم عند تحديث المدرسة: ${error.message}` });
    }
});

// [DELETE] حذف مدرسة بناءً على الـ ID
app.delete('/api/schools/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE request to /api/schools/${id}`);
    
    try {
        const count = await knex('schools').where({ id: id }).del();

        if (count === 0) {
            return res.status(404).json({ message: 'المدرسة غير موجودة.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting school:', error);
        res.status(500).json({ message: `خطأ في الخادم عند حذف المدرسة: ${error.message}` });
    }
});

// --- Reports API Endpoint ---

const testTables = ['timssResults', 'pisaResults', 'pirlsResults', 'nationalTestResults', 'assessmentTestResults', 'unifiedTestResults', 'literacyNumeracyResults', 'aloResults'];

// [GET] A new endpoint to fetch all data needed for the reports page efficiently.
app.get('/api/reports/all-data', async (req, res) => {
    console.log('GET request to /api/reports/all-data');
    try {
        const queries = [
            knex('schools').select('*').orderBy('id', 'desc'),
            ...testTables.map(table => knex(table).select('*').orderBy('id', 'desc'))
        ];

        const [schools, ...allTestResults] = await Promise.all(queries);

        const responseData = {
            schools: schools.map(mapSchoolData)
        };
        
        testTables.forEach((table, index) => {
            responseData[table] = allTestResults[index];
        });

        res.json(responseData);

    } catch (error) {
        console.error('Error fetching all report data:', error);
        res.status(500).json({ message: `خطأ في الخادم عند جلب بيانات التقارير: ${error.message}` });
    }
});


// --- TEST RESULTS API ---

// Helper function to create CRUD endpoints for a test result type
const createTestResultEndpoints = (tableName) => {
    const resource = `/api/${tableName}`;
    
    // GET all results
    app.get(resource, async (req, res) => {
        try {
            const results = await knex(tableName).select('*').orderBy('id', 'desc');
            res.json(results);
        } catch (error) {
            console.error(`Error fetching from ${tableName}:`, error);
            res.status(500).json({ message: `خطأ في الخادم: ${error.message}` });
        }
    });

    // POST a new result
    app.post(resource, async (req, res) => {
        try {
            const [addedItem] = await knex(tableName).insert(req.body).returning('*');
            res.status(201).json(addedItem);
        } catch (error)
 {
            console.error(`Error adding to ${tableName}:`, error);
            res.status(500).json({ message: `خطأ في الخادم: ${error.message}` });
        }
    });

    // POST batch of new results
    app.post(`${resource}/batch`, async (req, res) => {
        const trx = await knex.transaction();
        try {
            const items = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                await trx.rollback();
                return res.status(400).json({ message: 'البيانات المرسلة يجب أن تكون مصفوفة غير فارغة.' });
            }
            
            const chunkSize = 100;
            for (let i = 0; i < items.length; i += chunkSize) {
                const chunk = items.slice(i, i + chunkSize);
                await trx(tableName).insert(chunk);
            }
            
            await trx.commit();
            res.status(201).json({ message: `تمت إضافة ${items.length} نتيجة بنجاح.` });
        } catch (error) {
            await trx.rollback();
            console.error(`Error batch adding to ${tableName}:`, error);
            res.status(500).json({ message: `خطأ في الخادم: ${error.message}` });
        }
    });

    // PUT update a result
    app.put(`${resource}/:id`, async (req, res) => {
        const { id } = req.params;
        try {
            const [updatedItem] = await knex(tableName).where({ id }).update(req.body).returning('*');
            if (!updatedItem) return res.status(404).json({ message: 'النتيجة غير موجودة.' });
            res.json(updatedItem);
        } catch (error) {
            console.error(`Error updating ${tableName}:`, error);
            res.status(500).json({ message: `خطأ في الخادم: ${error.message}` });
        }
    });

    // DELETE a result
    app.delete(`${resource}/:id`, async (req, res) => {
        const { id } = req.params;
        try {
            const count = await knex(tableName).where({ id }).del();
            if (count === 0) return res.status(404).json({ message: 'النتيجة غير موجودة.' });
            res.status(204).send();
        } catch (error) {
            console.error(`Error deleting from ${tableName}:`, error);
            res.status(500).json({ message: `خطأ في الخادم: ${error.message}` });
        }
    });
    
    console.log(`⚡️ API endpoints created for ${resource}`);
};

// Create endpoints for all test types
testTables.forEach(createTestResultEndpoints);


// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل الآن على http://localhost:${PORT}`);
    console.log('قاعدة البيانات متصلة وجاهزة.');
});