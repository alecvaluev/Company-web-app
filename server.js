/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Aleksandr Valuev   Student ID: 165445198   Date: 11/29/2021
*
* Online (Heroku) Link: https://mighty-harbor-74304.herokuapp.com/
*
********************************************************************************/ 
const express = require("express");
const app = express();
const path = require("path");
const dataService = require("./data-service");
const dataServiceAuth = require("./data-service-auth");
const clientSessions = require("client-sessions");
const multer = require("multer");
const storage = multer.diskStorage({
    destination: './public/images/uploaded',
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
})
const upload = multer({storage: storage});
const fs = require("fs");
const bodyParser = require("body-parser");
const exphbs = require('express-handlebars');

app.engine(".hbs", exphbs({ 
                        extname: '.hbs',
                        defaultLayout: 'main',
                        helpers: {
                            navLink: function(url, options){
                                return '<li' +
                                    ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                                    '><a href="' + url + '">' + options.fn(this) + '</a></li>';
                                },
                            equal: function (lvalue, rvalue, options) {
                                if (arguments.length < 3)
                                    throw new Error("Handlebars Helper equal needs 2 parameters");
                                if (lvalue != rvalue) {
                                    return options.inverse(this);
                                } else {
                                    return options.fn(this);
                                }
                                },
                        } }));
app.set('view engine','.hbs');

app.use(clientSessions({
    cookieName: "session",
    secret: "web322",
    deration: 2 * 60 * 1000,
    activeDuration: 100 * 60
}));

app.use(function(req, res, next){
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }

var HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}
//set middleware

app.use(express.static('public'));
app.use(express.urlencoded({extended: false})); // was true
app.use(function(req, res, next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "?" : route.replace(/\/$/, "");
    next();
})
// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function(req,res){
    res.render(path.join(__dirname,"/views/home"));
});

// setup another route to listen on /about
app.get("/about", function(req,res){
    res.render(path.join(__dirname, "/views/about"));
});

app.get("/employees", ensureLogin, function(req, res){
    const query = req.query;

    function getEmployees(){
        if(query.status) return dataService.getEmployeeByStatus(query.status);
        else if(query.department) return dataService.getEmployeeByDepartment(query.department);
        else if(query.manager) return dataService.getEmployeeByManager(query.manager);
        else return dataService.getAllEmployees();
    }

    getEmployees()
        .then((data) => {
            if(data.length > 0) {
               res.render("employees", {employees: data});
            }
            else{
                res.render("employees", {message: "no results"});
            }
        })
        .catch((err) => res.render("employees", {message: err}));
});

app.get("/employee/:value", ensureLogin, function(req, res){
    //initialize an empty object to store the values
    let viewData = {};

    dataService.getEmployeesNum(req.params.value)
        .then((data) =>{
            if(data){
                viewData.employee = data;
            }else{
                viewData.employee = null;
            }
        })
        .catch(() =>{
            viewData.employee = null;
        })
        .then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data;

            for(let i = 0; i < viewData.departments.length; i++){
                if(viewData.departments[i].departmentId == viewData.employee.department){
                    viewData.departments[i].selected = true;
                }
            }
        })
        .catch(() =>{
            viewData.departments = [];
        })
        .then(() => {
            if(viewData.employee == null){
                res.status(404).send("employee Not Found");
            }else{
                res.render("employee", {viewData:viewData});
            }
        });
})

app.get("/departments", ensureLogin, function(req, res){
    dataService.getDepartments()
        .then((data) => {
            res.render("departments", {departments: data})
            
            if(data.length > 0) res.render("departments", {departments: data});
            else res.render("departments", {message: "no results"});
        })
        .catch((err) => res.render("departments", {message: err}));
})

app.get("/employees/add", ensureLogin, function(req, res){
    dataService.getDepartments()
    .then((data) => res.render("addEmployee", {departments: data}))
    .catch(() => res.render("addEmployee", {departments: []}));
})

app.get("/images/add", ensureLogin, function(req, res){
    res.render(path.join(__dirname, "./views/addImage"));
})

app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
    res.redirect("/images");
})

app.get("/images", ensureLogin, function(req, res){
    fs.readdir("./public/images/uploaded", function(err, items){
        let images = {
            images: items,
        }
        res.render("images", images);
    })
});

app.post("/employees/add", ensureLogin, (req, res) =>{
    dataService.addEmployee(req.body)
    .catch((err)=>{
        res.status(500).send(err);
       });
    res.redirect("/employees");
});

app.post("/employee/update", ensureLogin, (req, res) => { 
    //console.log(req.body);
    dataService.updateEmployee(req.body)
        .then(res.redirect("/employees"))
        .catch((err)=>{
            res.status(500).send(err);
           });;
});

app.get("/departments/add", ensureLogin, (req, res) => {
    res.render("addDepartment");
});

app.post("/departments/add", ensureLogin, (req, res) => {
    //console.log(req.body);
    dataService.addDepartment(req.body)
    .then(() => res.redirect("/departments"))
    .catch((err)=>{
        res.status(500).send(err);
       });
})

app.post("/department/update", ensureLogin, (req, res) => { 
    //console.log(req.body);
    dataService.updateDepartment(req.body)
        .then(res.redirect("/departments"))
        .catch((err)=>{
            res.status(500).send(err);
           });
});

app.get("/department/:departmentId", ensureLogin, function(req, res){
    dataService.getDepartmentById(req.params.departmentId)
        .then((data) => res.render("department", { department: data }))
        .catch((err) => res.status(404).send("Department Not Found"));
})

app.get("/departments/delete/:departmentId", ensureLogin, function(req, res){
    dataService.deleteDepartmentById(req.params.departmentId)
        .then(() => res.redirect("/departments"))
        .catch(() => res.status(500).send("Unable to Remove Departmnet / Department not found)"));
})

app.get("/employees/delete/:empNum", ensureLogin, function(req, res){
    dataService.deleteEmployeeByNum(req.params.empNum)
    .then(() => res.redirect("/employees"))
    .catch(() => res.status(500).send("Unable to Remove Employee / Employee not found)"));
})

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    dataServiceAuth.registerUser(req.body)
    .then(()=>{
        res.render("register", {successMessage: "User created"});
    })
    .catch((err) => {
        res.render("register", {errorMessage: err, userName: req.body.userName});
    });
});

app.post("/login", function(req, res) {
    req.body.userAgent = req.get('User-Agent');

    dataServiceAuth.checkUser(req.body)
    .then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        };

        res.redirect('/employees');
    })
    .catch((err) => {
        res.render('login', {errorMessage: err, userName: req.body.userName})
    })
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect('/');
});

app.get("/userHistory", ensureLogin, function(req, res){
    res.render("userHistory");
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

// setup http server to listen on HTTP_PORT
dataService.initialize()
    .then(dataServiceAuth.initialize)
    .then(() => app.listen(HTTP_PORT, onHttpStart))
    .catch(function(err){
        console.log('Error - ' + err);
  });
