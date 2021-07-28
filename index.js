// Required modules
require('dotenv').config();
const inquirer = require('inquirer');
const mysql = require('mysql2');

// Connect to the employees_db
const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASS,
      database: 'employees_db'
    },
);

// Inquirer question arrays
const categoryQuestions = [
    {
        type: "list",
        message: "Please select a category to view, add to, or update.",
        name: "category",
        choices: ["Departments","Roles","Employees","Quit"]
    }
];
const departmentQuestions = [
    {
        type: "list",
        message: "What would you like to do?",
        name: "action",
        choices: ["View All Departments","Add A Department"]
    }
];
const addDepartmentQuestions = [
    {
        type: "input",
        message: "What is the name of the new department?",
        name: "name",
        validate: (input) => {
            if(input !== "") return true;
            return "Please enter a department name.";
        }
    }
];

// Add a department to database
const addDepartment = () => {
    inquirer
        .prompt(addDepartmentQuestions)
        .then((addDepartmentAnswer) => {

            const deptName = addDepartmentAnswer.name;
        
            db.query('INSERT INTO department (name) VALUES (?)', deptName, (err, results) => {
                
                if (err) console.log(err);
                
                console.log(`Added ${deptName} to the database.`);

                return askForCategory();
            });
        });
}

// View the data on a table with the table name passed in
const viewAllTable = (table) => {
    db.query(`SELECT * FROM ${table}`, (err, results) => {
        
        if (err) console.log(err);
      
        console.log('\n');
        console.table(results);
        console.log('\n');

        return askForCategory();
    });
}

// Ask the user for what action they want to take with departments
const AskForDepartmentAction = () => {
    inquirer
        .prompt(departmentQuestions)
        .then((departmentAnswer) => {

            switch(departmentAnswer.action) {

                case "View All Departments":
                    return viewAllTable('department');

                case "Add A Department":
                    return addDepartment();
            }
        });
}

// Ask the user what category of data they want to work with
const askForCategory = () => {
    inquirer
        .prompt(categoryQuestions)
        .then((categoryAnswer) => {

            switch(categoryAnswer.category) {

                case "Departments":
                    return AskForDepartmentAction();

                // case "Roles":
                //     return AskForRoleAction();

                // case "Employees":
                //     return AskForEmployeeAction();

                case "Quit":
                    return process.exit();
            }
        });
}

askForCategory();