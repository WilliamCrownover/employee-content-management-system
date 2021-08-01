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
        FROM department
        ORDER BY name ASC`, 
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

// View the data on the 'employee' table joined with department and role tables 
const selectEmployeeTable = () => {
    db.query(`
        SELECT 
            e.id, 
            CONCAT(e.first_name, ' ', e.last_name) AS 'full name', 
            title AS 'job title', 
            salary, 
            name AS department,
            CONCAT(m.first_name, ' ', m.last_name) AS manager 
        FROM employee e 
        LEFT JOIN employee m 
            ON e.manager_id = m.id
        JOIN role r 
            ON e.role_id = r.id
        JOIN department d 
            ON r.department_id = d.id
        ORDER BY department ASC, salary DESC`, 
        (err, results) => {
        
            if (err) console.log(err);
        
            viewTable(results);

            return askForCategory();
        }
    );
}

// Add an employee to database
const addEmployee = () => {
    db.query(`
        SELECT id, title 
        FROM role
        ORDER BY title ASC`, 
        (err, results) => {

            if (err) console.log(err);

            let roleArray = results.map(role => ({
                name: role.title,
                value: role.id
            }));

            questions.addEmployee.push(constructListQuestion("Choose a role for this employee", "role", roleArray));

            db.query(`
                SELECT e.id, CONCAT(first_name, ' ', last_name, ' TITLE ', title, ')') AS name
                FROM employee e
                JOIN role r 
                    ON e.role_id = r.id    
                WHERE manager_id IS NULL
                ORDER BY name ASC`, 
                (err, results) => {

                    if (err) console.log(err);

                    let managerArray = results.map(manager => ({
                        name: manager.name,
                        value: manager.id
                    }));

                    managerArray.push({
                        name: "No Manager",
                        value: null
                    });
        
                    questions.addEmployee.push(constructListQuestion("Choose a manager for this employee", "manager", managerArray));
                            
                    inquirer
                        .prompt(questions.addEmployee)
                        .then((addEmployeeAnswers) => {

                            const first_name = addEmployeeAnswers.first_name;
                            const last_name = addEmployeeAnswers.last_name;
                            const role_id = addEmployeeAnswers.role;
                            const manager_id = addEmployeeAnswers.manager;

                            db.query(`
                                INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                                VALUES (?, ?, ?, ?)`, [first_name, last_name, role_id, manager_id], 
                                (err, results) => {                    

                                    if (err) console.log(err);
                                    
                                    console.log('\x1b[32m', `Added ${first_name} ${last_name} to the database.`, '\x1b[0m');

                                    return askForCategory();
                                }
                            );    
                        });
                }
            )
        }
    )
}

// Ask the user for what action they want to take with employees
const AskForEmployeeAction = () => {
    inquirer
        .prompt(questions.employee)
        .then((employeeAnswer) => {

            switch(employeeAnswer.action) {

                case "View All Employees":
                    return selectEmployeeTable();

                case "Add An Employee":
                    return addEmployee();

                case "Update An Employee's Role":
                    return updateEmployeeRole();
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

                case "Employees":
                    return AskForEmployeeAction();

                case "Quit":
                    console.log('\x1b[34m', 'Goodbye!', '\x1b[0m');
                    return db.end();
            }
        });
}

askForCategory();