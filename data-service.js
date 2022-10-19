const Sequelize =  require('sequelize');
var sequelize = new Sequelize('ddem2l1uuuggql', 'xjujgvrkencfou', '737e47d97e954cc40d503dffb0346f366f09f6a7ddfe65095cff93de0215f591', {
    host: 'ec2-54-160-35-196.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions:{
        ssl: {rejectUnauthorized: false}
    },
    query: { raw: true }
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department',{
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

Department.hasMany(Employee, {foreignKey: 'department'});

module.exports.initialize = function(){
    
    return new Promise((resolve, reject) => {
        sequelize.sync()
        .then(() =>{
            resolve();
        })
        .catch(() =>{
            reject("unable to sync the database");
        });
    });
};

module.exports.getAllEmployees = function(){
    return new Promise(function(resolve, reject){
        console.log('--here--', Employee.findAll())
        Employee.findAll()
        .then((data) =>{
            resolve(data);
        })
        .catch((err) => {
            console.error(err)
            reject("No results retured for employees")
        });
    });
};


module.exports.getDepartments = function(){
    return new Promise(function(resolve, reject){
        Department.findAll()
        .then((data) =>{
            resolve(data);
        })
        .catch(() => {
            console.error(err);
            reject("No results retured for departments");
        });
    });
};

module.exports.addEmployee = function(employeeData){
    return new Promise((resolve, reject) =>{
        employeeData.isManager = (employeeData.isManager)? true : false; 
        for(const attr in employeeData){
            if(attr === "") employeeData[attr] = null;
        }
        console.log(employeeData)
        Employee.create(employeeData)
        .then(() =>{
            resolve();
        })
        .catch(() => reject("unable to create employee"));
    });
}


module.exports.getEmployeeByStatus = function(status){
    return new Promise((resolve, reject) =>{
        Employee.findAll()
        .then((data)=>{
            data = data.filter(emp => emp.status === status);
            resolve(data);
        })
        .catch(() => reject("No results returned"));
    });
}
module.exports.getEmployeeByDepartment = function(department){
    return new Promise((resolve, reject) =>{
        Employee.findAll()
        .then((data)=>{
            data = data.filter(emp => emp.department == department);
            resolve(data);
        })
        .catch(() => reject("No results returned"));
    });
}
module.exports.getEmployeeByManager = function(manager){
    return new Promise((resolve, reject) =>{
        Employee.findAll()
        .then((data)=>{
            data = data.filter(emp => emp.employeeManagerNum == manager);
            resolve(data);
        })
        .catch(() => reject("No results returned"));
    });
}

module.exports.getEmployeesNum = function(num){
    return new Promise((resolve, reject) =>{
        Employee.findAll()
        .then((data)=>{
            data = data.find(emp => emp.employeeNum == num);
            resolve(data);
        })
        .catch(() => reject("No results returned"));
    });
}

module.exports.updateEmployee = function(employeeData){
    return new Promise((resolve, reject) =>{
        employeeData.isManager = (employeeData.isManager)? true : false; 
        for(const attr in employeeData){
            if(attr == "") employeeData[attr] = null;
        }
        Employee.update(employeeData, { where: { employeeNum: employeeData.employeeNum}})
        .then(() =>{
            console.log('employee updated')
            resolve();
        })
        .catch((err) => {
            console.error(err);
            reject("unable to update employee")
        });
    });
}

module.exports.addDepartment = function(departmentData){
    return new Promise((resolve, reject) => {
        for(const attr in departmentData){
            if(attr == "") departmentData[attr] = null;
        };
        Department.create(departmentData)
        .then(() => resolve())
        .catch(() => reject("unable to create department"));
    });
}

module.exports.updateDepartment = function(departmentData){
    return new Promise((resolve, reject) => {
        for(const attr in departmentData){
            if(attr == "") departmentData[attr] = null;
        };
        Department.update(departmentData, {where: { departmentId: departmentData.departmentId}})
        .then(() => resolve())
        .catch((err) => {
            console.error(err);
            reject("unable to update department");
        }); 
    })
}

module.exports.getDepartmentById = function(id){
    return new Promise((resolve, reject) => {
        Department.findAll()
        .then((data) => {
            data = data.find(dep => dep.departmentId == id);
            resolve(data);
        })
        .catch(() => reject("No results returned")); 
    });
}

module.exports.deleteDepartmentById = function(id){
    return new Promise((resolve, reject) => {
        Department.destroy({where: {departmentId: id}})
        .then(() => resolve())
        .catch(() => reject("No results returned")); 
    });
}

module.exports.deleteEmployeeByNum = function(num){
    return new Promise((resolve, reject) => {
        Employee.destroy({where: {employeeNum: num}})
        .then(() => resolve())
        .catch(() => reject("No results returned")); 
    });
}
