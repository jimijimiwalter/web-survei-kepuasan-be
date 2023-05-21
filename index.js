require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors')

const jwt = require('jsonwebtoken');
const { survei, middleware } = require('./controllers');
const multer = require('multer')
const fs = require('fs')

var upload = multer({ dest: "uploads/" })

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

const origin = process.env.ORIGIN.split(",")
app.use(cors(
    {
        allowedHeaders: ["Authorization", "Access-Control-Allow-Origin", "Content-Type", "Access-Control-Allow-Credentials"],
        credentials: true,
        origin: origin
    }
))

const ALL_ROLE = ['ADMIN', 'MAHASISWA', 'DOSEN', 'ALUMNI']
const ONLY_ADMIN = ['ADMIN']
const ONLY_MAHASISWA = ['ADMIN', 'MAHASISWA']
const ONLY_DOSEN = ['ADMIN', 'DOSEN']
const ONLY_ALUMNI = ['ADMIN', 'ALUMNI']
const MAX_AGE_COOKIE = 3 * 24 * 60 * 60 * 1000 // 3d same as jwt expired time

app.get('/cookie', (req, res) => {
    res.cookie('testerslicecookie', "somecookie", { maxAge: MAX_AGE_COOKIE, httpOnly: false , sameSite: 'none', secure: true});
    res.cookie('userinfo', "blablabla", { maxAge: MAX_AGE_COOKIE });
    res.json({ "ok": 'Hello World! Cookie' })
})

app.post('/login/:role', survei.login)

app.get('/dosen/suggest', middleware(ONLY_ADMIN), survei.getDosenWithSuggest) // get dosen with suggest ?query=
app.get('/dosen/:id', middleware(ONLY_DOSEN), survei.getDosenById) // get dosen by id
app.get('/dosen', middleware(ONLY_ADMIN), survei.getAllDosen) // get all dosen 
app.post('/dosen/bulk', middleware(ONLY_ADMIN), upload.single('file'), survei.bulkInsertDosen)
app.post('/dosen', middleware(ONLY_ADMIN), survei.newDosen) // new dosen
app.put('/dosen/:id', middleware(ONLY_ADMIN), survei.updateDosen)

app.get('/mahasiswa/suggest', middleware(ONLY_ADMIN), survei.getMahasiswaWithSuggest) // get mahasiswa with suggest ?query=
app.get('/mahasiswa/:id', middleware(ONLY_MAHASISWA), survei.getMahasiswaById) // get mahasiswa by id
app.get('/mahasiswa', middleware(ONLY_ADMIN), survei.getAllMahasiswa) // &sortBy=angkatan/semester&orderBy=asc/desc
app.post('/mahasiswa/bulk', middleware(ONLY_ADMIN), upload.single('file'), survei.bulkInsertMahasiswa)
app.post('/mahasiswa', middleware(ONLY_ADMIN), survei.newMahasiswa) // new mahasiswa
app.put('/mahasiswa/:id', middleware(ONLY_ADMIN), survei.updateMahasiswa)

app.get('/alumni/suggest', middleware(ONLY_ADMIN), survei.getAlumniWithSuggest) // get alumni with suggest ?query=
app.get('/alumni/:id', middleware(ONLY_ALUMNI), survei.getAlumniById) // get mahasiswa by id
app.get('/alumni', middleware(ONLY_ADMIN), survei.getAllAlumni) // &sortBy=angkatan/semester&orderBy=asc/desc
app.post('/alumni/bulk', middleware(ONLY_ADMIN), upload.single('file'), survei.bulkInsertAlumni)
app.post('/alumni', middleware(ONLY_ADMIN), survei.newAlumni) // new alumni 
app.put('/alumni/:id', middleware(ONLY_ADMIN), survei.updateAlumni)

app.post('/matkul', middleware(ONLY_ADMIN), survei.newMatkul)
app.post('/kelas', middleware(ONLY_ADMIN), survei.newKelas)
app.post('/insert-mahasiswa', middleware(ONLY_ADMIN), survei.addMahasiswaToKelas) // add mahasiswa ke kelas

app.get('/kelas/suggest', middleware(ONLY_ADMIN), survei.getKelasWithSuggest)
app.get('/kelas/:id', middleware(ONLY_ADMIN), survei.getKelasWithId) // detail kelas (mahasiwa, dosen, matkul)
app.get('/kelas', middleware(ONLY_ADMIN), survei.getAllKelas)

app.get('/matkul/suggest', middleware(ONLY_ADMIN), survei.getMatkulWithSuggest)

app.get(`/total-record`, middleware(ONLY_ADMIN), survei.getTotalRecord) // get total record from dosen / mahasiswa / alumni with query ?entity=

// get real time available survei, this endpoint will get data from db based on current date
// for example now is june 3 2024. The endpoint will try to query data from db from now until 3 week later (now + 3 week / 21 day)
// so it will query from available survei from june 3 until june 24
app.get('/survey', middleware(ALL_ROLE), survei.getSurvey) // ?role=mahasiswa/dosen/alumni
app.post('/questions', middleware(ONLY_ADMIN), survei.newSurveyQuestion) // create new survey question
app.post('/survey', middleware(ONLY_ADMIN), survei.newSurvey)
app.post('/survey-template', middleware(ONLY_ADMIN), survei.newTemplateSurvey)
app.get('/question/suggest', middleware(ONLY_ADMIN), survei.getQuestionWithSuggest) // get question suggestion with query param ?query=
app.get('/survey-template', middleware(ONLY_ADMIN), survei.getSurveyTemplate) // get survey template with query param ?entity=mahasiswa/dosen/alumni

app.post('/fill-survey/:role', middleware(ALL_ROLE), survei.fillSurvey)

// get history survey dosen/mahasiswa/dosen
app.get('/history/survey/:role', middleware(ALL_ROLE), survei.getHistorySurvey) // /history/survey/mahasiswa?id=${user_id}
// get all survei with that id and calculate ikm
// total kurang, cukup, baik, sangat baik
// ikm
// total responden
app.get('/statistic/survey/:role', middleware(ALL_ROLE), survei.getStatisticSurvey) // /statistic/survey/mahasiswa?id=${survei_id}

// get rekap, nama dosen semuanya per tanggal, ikm, total per opsi/bobot
app.get('/recap/survey/excel', middleware(ONLY_ADMIN), survei.getSurveyRecapExcel)
app.get('/recap/survey', middleware(ONLY_ADMIN), survei.getSurveyRecap) // /recap/survey?startDate=120380312&endDate=123213
app.delete('/remove-student', middleware(ONLY_ADMIN), survei.removeStudentFromClass) // /remove-mahasiswa?nim=123123&classId=1230823

console.log(`CORS set to: ${origin}`)
app.listen(process.env.PORT, () => console.log(`App running on port : ${process.env.PORT}`));
