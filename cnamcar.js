var express = require('express');
//Toujours appelé les middlewware dans l'ordre et en amont du fichier
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('mysql');
var passwordHash = require('password-hash');
var session = require('express-session')
const ejsLint = require('ejs-lint'); //a tester

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    port: '3306',
    database: 'carcnam',
    multipleStatements: true
});

var app = express();
//Store all HTML files in views folder.
app.use(express.static(__dirname + '/views'));
//Store all JS and CSS in web folder.
app.use(express.static(__dirname + '/web'));


// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

console.log(bodyParser);

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

//connection à la base de données
connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});
var sess;
//Affichage de l'accueil
app.get('/', urlencodedParser, function (req, res, next) {
var cat='SELECT * FROM `agence` ; SELECT * FROM `categorie`';
    sess=req.session
    if(sess.email){
        connection.query(cat, function (error, AgCat, fields) {
            
    
            res.render('accueil.ejs',{agence:AgCat[0],categorie:AgCat[1],name:sess.email});
    
          });
    }else{
        connection.query(cat, function (error, AgCat, fields) {
            if (error) throw error;
    
            res.render('accueil.ejs',{agence:AgCat[0],categorie:AgCat[1]});
    })
}   
    
});


//affichage page account
app.get('/account', function (req, res) {
    res.render('account.ejs');
});

app.post('/account', urlencodedParser, function (req, res) {
    res.render('account.ejs', {
        sexe: req.body.SexeUser,
        name: req.body.NomUser,
        surname: req.body.PrenomUser,
        adress: req.body.AdrUser,
        ville: req.body.VilUser,
        code: req.body.CpUser,
        phone: req.body.PhoneUser,
        mail: req.body.EmailUser,
        pwd: req.body.MdpUser
    });
    var sexe = req.body.SexeUser;
    var name = req.body.NomUser;
    var surname = req.body.PrenomUser;
    var adress = req.body.AdrUser;
    var ville = req.body.VilUser;
    var code = req.body.CpUser;
    var phone = req.body.PhoneUser;
    var mail = req.body.EmailUser;
    var pwd = passwordHash.generate(req.body.MdpUser);
    console.log(pwd);
    console.log("post received: %s", name, surname, adress, phone, mail, pwd);

    connection.query('INSERT INTO clients SET ?', {
        SexeCl: sexe,
        NomCl: name,
        PreCl: surname,
        AdrCl: adress,
        VilCl: ville,
        CpCl: code,
        TelCl: phone,
        EmailCl: mail,
        MdpCl: pwd
    }, function (error, results, fields) {
        if (error) throw error;
        console.log(results.insertId);
    });

});

//affichage page avec maps
app.get('/maps', function (req, res) {
    res.render('maps.ejs');
});
//affiche la page login
app.get('/login', function (req, res) {
    res.render('login.ejs');
});

//recupere le login
app.post('/log', urlencodedParser, function (req, res) {

    var name = req.body.NomUser
    var pwd = req.body.MdpUser
    sess=req.session

    console.log("post received: %s", name, pwd);
    connection.query('SELECT * FROM clients', (err, client) => {
        if (err) throw err;
        
        client.forEach((row) => {
            if (row.NomCl === name && passwordHash.verify(pwd, row.MdpCl)) {
                connection.query('SELECT * FROM `agence` ; SELECT * FROM `categorie`', function (error, fields) {
                    if (error) throw error;
                    sess.email=row.NomCl
                    res.redirect('/');
                });  
            }else if(name === 'admin' && pwd=== 'admin'){
                res.redirect('/admin');
                // res.render('agence.ejs', {name: name});
            }else{
                if (error) throw error;
                    res.redirect('/');
            }
        });
        
    });

});

// ********************  ADMIN ***************************

//accès page admin
app.get('/admin', function(req, res)  {
    connection.query('SELECT * FROM `agence`', function (error, rows, fields) {
        if (error) throw error;
        res.render('admin/agence.ejs',{tasks:rows});
      });
   
});

//accès page admin catégorie
app.get('/admin/categorie', function(req, res)  {
    connection.query('SELECT * FROM `categorie`', function (error, rows, fields) {
        ejsLint('admin/Categorie.ejs'); //marche po  a approfondir
        if (error) throw error;
        res.render('admin/Categorie.ejs',{tasks:rows});
      });

});

//accès page admin véhicule
app.get('/admin/vehicule', function(req, res)  {
    connection.query('SELECT * FROM `vehicules`', function (error, rows, fields) {
        ejsLint('admin/Categorie.ejs'); //marche po  a approfondir
        if (error) throw error;
        res.render('admin/Vehicule.ejs',{tasks:rows});
      });

});

//Accès ajout d'une agence
app.all('/admin/add', urlencodedParser, function (req, res) {
   
    var errorMessages = [''];
    var error, issuccess;
    var test=false;
    if (test) {
        error = issuccess = false;
        if (!name) {
            error = true;
            errorMessages[0] = 'veuillez remplir le nom';
            console.log(errorMessages[0]);
        };
        if (!adr) {
            error = true;
            errorMessages[1] = 'veuillez remplir une adresse';
            console.log(errorMessages[1]);
        };
        if (!city) {
            error = true;
            errorMessages = 'veuillez remplir une Ville';
        };
        if (!cp) {
            error = true;
            errorMessages = 'veuillez remplir le code postal';
        };
        if (!tel) {
            error = true;
            errorMessages = 'veuillez remplir le telephone';
        };
        if (!mail) {
            error = true;
            errorMessages = 'veuillez remplir un Email';
        };
        if (!error) {
            var name = req.body.NomAg;
            var adr = req.body.AdrAg;
            var city = req.body.VilAg;
            var cp = req.body.CpAg;
            var tel = req.body.telAg;
            var mail = req.body.EmailAg;
            issuccess = true;
            connection.query('INSERT INTO Agence SET ?', {
                NomAg: name,
                AdrAg: adr,
                VilAg: city,
                CpAg: cp,
                telAg: tel,
                EmailAg: mail
            }, function (error, results, fields) {
                if (error) throw error;
                console.log(results.insertId);
                
            });
        }
    }
    res.render('admin/addAg.ejs', { errorMessage: errorMessages }
    );
    next();
});

//cette fonction permet d'afficher l'erreur 404 
//     !!!toujours placé celle-ci à la fin!!!!
app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('404 Page introuvable !');
});

//permet d'écouter sur le port cache de la machine a modifier en 80 pour un ftp par exemple
app.listen(8090);