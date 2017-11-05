const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('S3CRE7'));
app.use(session({
    secret: 'erazimerkirhayrenihogserdshathuysdmets',
    name: 'cool name',
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

// MySQL database configuration
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodemysql"
});

// connect to MySQL database
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});



const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {

	con.query("SELECT * FROM users", function(err, result) {
		res.render('index.ejs', {
			users: result
		});
	});

});

app.get('/signup', (req, res) => {

	res.render('signup');

});

app.get('/login', (req, res) => {

	res.render('login'); 

});

app.get('/dashboard', (req, res) => {

	if(req.session.user) {
		res.render('dashboard');
	} else {
		res.redirect('/login');
	}

});

app.post('/signup', (req, res) => {

	let errors = [];

	let name = req.body.name,
		email = req.body.email,
		password = req.body.password;

	if(name.length === 0) {
		errors.push("Name should be at least 1 character long.");
	}

	if(email.length === 0) {
		errors.push("Invalid Email Address.");
	}

	if(password.length < 6) {
		errors.push("Password should be at least 6 characters long.");
	}


	if(errors.length != 0) {

		res.render('signup', {
			errors: errors
		});

	} else {
		bcrypt.hash(password, saltRounds=10, function(err, hash) {
		  	
		  	// Store hash in your password DB.
			let sql = `INSERT INTO users (name, email, password_hash)`;
				sql += `VALUES ('${name}', '${email}', '${hash}')`; 

			con.query(sql, (err, result) => {
				if (err) throw err;
				console.log(result);

				req.session.user = { name: name, email: email };

				res.redirect('/');
			});

		});
	}

});

app.post('/login', (req, res) => {

	let errors = [];

	let email = req.body.email,
		password = req.body.password;

	let sql = `SELECT * FROM users WHERE email = '${email}' `;

	con.query(sql, (err, result) => {
		if (err) throw err;

		if(result.length) {
		
			// Load hash from your password DB.
			bcrypt.compare(password, result[0].password_hash, function(err, resp) {
			    if(resp) {
			    	console.log("Logged in");

			    	req.session.user = { name: result[0].name, email: result[0].email };

			    	res.redirect('/');
			    } else {

			    	errors.push("Email/Password Incorrect.");

			    	console.log("Incorrect Password");
			    
					res.render('login', {
						errors: errors
					});

			    }
			});

		} else {
			console.log("Account not found.");

			errors.push("Email/Password Incorrect.");

			res.render('login', {
				errors: errors
			});
		}

	});

});

app.get('/logout', (req, res) => {

	req.session.user = "";

	res.redirect('/dashboard');

});

app.listen(PORT, () => console.log("App running"));
	
