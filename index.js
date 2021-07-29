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
const roleQuestions = [
    {
        type: "list",
        message: "What would you like to do?",
        name: "action",
        choices: ["View All Roles","Add A Role"]
    }
];
const addRoleQuestions = [
    {
        type: "input",
        message: "What is the title of the new role?",
        name: "title",
        validate: (input) => {
            if(input !== "") return true;
            return "Please enter a role title.";
        }
    },
    {
        type: "input",
        message: "What is the salary for the new role?",
        name: "salary",
        validate: (input) => {
            if(input !== "" && /\d/.test(input)) return true;
            return "Please enter a numeric salary.";
        }
    }
];

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

// Takes a message, property name, and object array of names to create a list question
const constructListQuestion = (message, name, objArray) => {
    let list = [];
    
    objArray.forEach(i => list.push(i.name));

    const question = {
        type: "list",
        message: message,
        name: name,
        choices: list
    }
    
    return question;
}

// Add a role to database
const addRole = () => {
    db.query('SELECT name FROM department', (err, results) => {

        addRoleQuestions.push(constructListQuestion("Choose a department for this role", "department", results));
    
        inquirer
            .prompt(addRoleQuestions)
            .then((addRoleAnswers) => {

                const title = addRoleAnswers.title;
                const salary = addRoleAnswers.salary;
                const department = addRoleAnswers.department;

                db.query('SELECT id FROM department WHERE name = ?', department, (err, results) => {

                    if (err) console.log(err);
                    
                    const department_id = results[0].id;

                    db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [title, salary, department_id], (err, results) => {                    

                        if (err) console.log(err);
                        
                        console.log(`Added ${title} to the database.`);
    
                        return askForCategory();
                    });    
                })
            });
    })
}

// Ask the user for what action they want to take with roles
const AskForRoleAction = () => {
    inquirer
        .prompt(roleQuestions)
        .then((roleAnswer) => {

            switch(roleAnswer.action) {

                case "View All Roles":
                    return viewAllTable('role');

                case "Add A Role":
                    return addRole();
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

                case "Roles":
                    return AskForRoleAction();

                // case "Employees":
                //     return AskForEmployeeAction();

                case "Quit":
                    return process.exit();
            }
        });
}

askForCategory();