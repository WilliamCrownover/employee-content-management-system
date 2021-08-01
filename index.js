// Required modules
require('dotenv').config();
const inquirer = require('inquirer');
const mysql = require('mysql2');
const questions = require('./assets/questions');

// Connect to the employees_db
const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASS,
      database: 'employees_db'
    },
);

// db.query = util.promisify(db.query);

// Display the table to the console
const viewTable = (table) => {
    console.log('\n');
    console.table(table);
    console.log('\n');
}

// View the data on the 'department' table
const selectDepartmentTable = () => {
    db.query(`
        SELECT * 
        FROM department 
        ORDER BY name ASC`, 
        (err, results) => {
        
            if (err) console.log(err);
        
            viewTable(results);

            return askForCategory();
        }
    );
}

// Add a department to database
const addDepartment = () => {
    inquirer
        .prompt(questions.addDepartment)
        .then((addDepartmentAnswer) => {

            const deptName = addDepartmentAnswer.name;
        
            db.query(`
                INSERT INTO department (name) 
                VALUES (?)`, deptName, 
                (err, results) => {
                
                    if (err) console.log(err);
                    
                    console.log('\x1b[32m', `Added ${deptName} to the database.`, '\x1b[0m');

                    return askForCategory();
                }
            );
        });
}

// Ask the user for what action they want to take with departments
const AskForDepartmentAction = () => {
    inquirer
        .prompt(questions.department)
        .then((departmentAnswer) => {

            switch(departmentAnswer.action) {

                case "View All Departments":
                    return selectDepartmentTable();

                case "Add A Department":
                    return addDepartment();
            }
        });
}

// Takes a message, property name, and object array to create a list question
const constructListQuestion = (message, name, objArray) => {

    const question = {
        type: "list",
        message: message,
        name: name,
        choices: objArray
    }
    
    return question;
}

// View the data on the 'role' table joined with department table 
const selectRoleTable = () => {
    db.query(`
        SELECT 
            r.id, 
            title, 
            salary, 
            name AS department 
        FROM role r 
        JOIN department d 
        ON r.department_id = d.id
        ORDER BY department ASC, salary ASC`, 
        (err, results) => {
        
            if (err) console.log(err);
        
            viewTable(results);

            return askForCategory();
        }
    );
}

// Add a role to database
const addRole = () => {
    db.query(`
        SELECT * 
        FROM department`, 
        (err, results) => {

            if (err) console.log(err);

            let deptArray = results.map(dept => ({
                name: dept.name,
                value: dept.id
            }));

            questions.addRole.push(constructListQuestion("Choose a department for this role", "department", deptArray));
        
            inquirer
                .prompt(questions.addRole)
                .then((addRoleAnswers) => {

                    const title = addRoleAnswers.title;
                    const salary = addRoleAnswers.salary;
                    const department = addRoleAnswers.department;

                    db.query(`
                        INSERT INTO role (title, salary, department_id) 
                        VALUES (?, ?, ?)`, [title, salary, department], 
                        (err, results) => {                    

                            if (err) console.log(err);
                            
                            console.log('\x1b[32m', `Added ${title} to the database.`, '\x1b[0m');

                            return askForCategory();
                        }
                    );    
                });
        }
    )
}

// Ask the user for what action they want to take with roles
const AskForRoleAction = () => {
    inquirer
        .prompt(questions.role)
        .then((roleAnswer) => {

            switch(roleAnswer.action) {

                case "View All Roles":
                    return selectRoleTable();

                case "Add A Role":
                    return addRole();
            }
        });
}

// Ask the user what category of data they want to work with
const askForCategory = () => {
    inquirer
        .prompt(questions.category)
        .then((categoryAnswer) => {

            switch(categoryAnswer.category) {

                case "Departments":
                    return AskForDepartmentAction();

                case "Roles":
                    return AskForRoleAction();

                // case "Employees":
                //     return AskForEmployeeAction();

                case "Quit":
                    console.log('\x1b[34m', 'Goodbye!', '\x1b[0m');
                    return db.end();
            }
        });
}

askForCategory();