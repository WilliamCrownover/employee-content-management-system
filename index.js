// Required modules
require('dotenv').config();
const inquirer = require('inquirer');
const mysql = require('mysql2');
const util = require('util');
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

db.query = util.promisify(db.query);

// Display the table to the console
const viewTable = (table) => {
    console.log('\n');
    console.table(table);
    console.log('\n');
}

// View the data on the 'department' table
const selectDepartmentTable = async () => {
    try {
        const table = await db.query(`
            SELECT * 
            FROM department 
            ORDER BY name ASC`);
    
        viewTable(table);

        return askForCategory();

    } catch (err) {
        console.log(err);
    }
}

// Add a department to database
const addDepartment = () => {
    inquirer
        .prompt(questions.addDepartment)
        .then(async (addDepartmentAnswer) => {

            const deptName = addDepartmentAnswer.name;
            
            try {
                await db.query(`
                    INSERT INTO department (name) 
                    VALUES (?)`, deptName);
                                    
                console.log('\x1b[32m', `Added ${deptName} to the database.`, '\x1b[0m');

                return askForCategory();
                
            } catch (err) {
                console.log(err);
            }
        });
}

// Remove a department
const deleteDepartment = async () => {
    let chooseDepartmentQuestions  = [];

    try {
        const table = await db.query(`
            SELECT * 
            FROM department 
            ORDER BY name ASC`);

        let deptArray = table.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

        chooseDepartmentQuestions.push(constructListQuestion("Choose a department to delete", "department", deptArray));
    
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(chooseDepartmentQuestions)
        .then(async (choosenDepartment) => {

            const department = choosenDepartment.department;

            try {
                await db.query(`
                    DELETE FROM department 
                    WHERE id = ?`, department);
                    
                console.log('\x1b[33m', `Deleted department from the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
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

                case "Delete A Department":
                    return deleteDepartment();
            }
        });
}

// Takes a message, property name, and object array to create a list question
const constructListQuestion = (message, name, objArray) => {
    return {
        type: "list",
        message: message,
        name: name,
        choices: objArray
    };
}

// View the data on the 'role' table joined with department table 
const selectRoleTable = async () => {
    try {
        const table = await db.query(`
            SELECT 
                r.id, 
                title, 
                CONCAT('$', FORMAT(salary/1000, 0), ' K') AS salary, 
                name AS department 
            FROM role r 
            LEFT JOIN department d 
            ON r.department_id = d.id
            ORDER BY department ASC, salary*1 ASC`); 
            
        viewTable(table);

        return askForCategory();

    } catch (err) {
        console.log(err);
    }
}

// Add a role to database
const addRole = async () => {
    try {
        const deptTable = await db.query(`
            SELECT * 
            FROM department
            ORDER BY name ASC`); 

        let deptArray = deptTable.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

        questions.addRole.push(constructListQuestion("Choose a department for this role", "department", deptArray));
    
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(questions.addRole)
        .then(async (addRoleAnswers) => {

            const { title, salary, department } = addRoleAnswers;

            try {
                await db.query(`
                    INSERT INTO role (title, salary, department_id) 
                    VALUES (?, ?, ?)`, [title, salary, department]);
                    
                console.log('\x1b[32m', `Added ${title} to the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });    
}

// Remove a role
const deleteRole = async () => {
    let chooseRoleQuestions  = [];

    try {
        const table = await db.query(`
            SELECT * 
            FROM role 
            ORDER BY title ASC`);

        let roleArray = table.map(role => ({
            name: role.title,
            value: role.id
        }));

        chooseRoleQuestions.push(constructListQuestion("Choose a role to delete", "role", roleArray));
    
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(chooseRoleQuestions)
        .then(async (choosenRole) => {

            const role = choosenRole.role;

            try {
                await db.query(`
                    DELETE FROM role 
                    WHERE id = ?`, role);
                    
                console.log('\x1b[33m', `Deleted role from the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
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

                case "Delete A Role":
                    return deleteRole();
            }
        });
}

// View the data on the 'employee' table joined with department and role tables 
const selectEmployeeTable = async () => {
    try {
        const table = await db.query(`
            SELECT 
                e.id, 
                CONCAT(e.first_name, ' ', e.last_name) AS 'full name', 
                title AS 'job title', 
                CONCAT('$', FORMAT(salary/1000, 0), ' K') AS salary, 
                name AS department,
                CONCAT(m.first_name, ' ', m.last_name) AS manager 
            FROM employee e 
            LEFT JOIN employee m 
                ON e.manager_id = m.id
            LEFT JOIN role r 
                ON e.role_id = r.id
            LEFT JOIN department d 
                ON r.department_id = d.id
            ORDER BY department ASC, salary*1 DESC`); 
        
        viewTable(table);

        return askForCategory();

    } catch (err) {
        console.log(err);
    }
}

// View the data on the 'employee' table by manager joined with department and role tables 
const selectEmployeeManagerTable = async () => {
    let chooseEmployeeManagerQuestions = [];

    try {
        const managerTable = await db.query(`        
            SELECT e.id, CONCAT(first_name, ' ', last_name, ' TITLE ', title) AS name
            FROM employee e
            JOIN role r 
                ON e.role_id = r.id    
            WHERE manager_id IS NULL
            ORDER BY name ASC`); 

        let managerArray = managerTable.map(manager => ({
            name: manager.name,
            value: manager.id
        }));

        chooseEmployeeManagerQuestions.push(constructListQuestion("What manager's employees would you like to see?", "manager", managerArray));

    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(chooseEmployeeManagerQuestions)
        .then(async (managerChoice) => {

            const manager = managerChoice.manager;

            try {
                const table = await db.query(`
                    SELECT 
                        e.id, 
                        CONCAT(e.first_name, ' ', e.last_name) AS 'full name', 
                        title AS 'job title', 
                        CONCAT('$', FORMAT(salary/1000, 0), ' K') AS salary, 
                        name AS department,
                        CONCAT(m.first_name, ' ', m.last_name) AS manager 
                    FROM employee e 
                    LEFT JOIN employee m 
                        ON e.manager_id = m.id
                    LEFT JOIN role r 
                        ON e.role_id = r.id
                    LEFT JOIN department d 
                        ON r.department_id = d.id
                    WHERE e.manager_id = ?
                    ORDER BY department ASC, salary DESC`, manager); 
                
                if(table.length === 0) {
                    console.log('\x1b[32m', `This manager has no employees.`, '\x1b[0m');
                } else {
                    viewTable(table);
                }
    
                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// View the data on the 'employee' table by department joined with department and role tables 
const selectEmployeeDepartmentTable = async () => {
    let chooseEmployeeDepartmentQuestions = [];

    try {
        const deptTable = await db.query(`
            SELECT * 
            FROM department
            ORDER BY name ASC`); 

        let deptArray = deptTable.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

        chooseEmployeeDepartmentQuestions.push(constructListQuestion("What department's employees would you like to see?", "department", deptArray));
    
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(chooseEmployeeDepartmentQuestions)
        .then(async (departmentChoice) => {

            const department = departmentChoice.department;

            try {
                const table = await db.query(`
                    SELECT 
                        e.id, 
                        CONCAT(e.first_name, ' ', e.last_name) AS 'full name', 
                        title AS 'job title', 
                        CONCAT('$', FORMAT(salary/1000, 0), ' K') AS salary, 
                        name AS department,
                        CONCAT(m.first_name, ' ', m.last_name) AS manager 
                    FROM employee e 
                    LEFT JOIN employee m 
                        ON e.manager_id = m.id
                    LEFT JOIN role r 
                        ON e.role_id = r.id
                    LEFT JOIN department d 
                        ON r.department_id = d.id
                    WHERE r.department_id = ?
                    ORDER BY department ASC, salary DESC`, department);
                    
                if(table.length === 0) {
                    console.log('\x1b[32m', `This department has no employees.`, '\x1b[0m');
                } else {
                    viewTable(table);
                }

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Add an employee to database
const addEmployee = async () => {
    try {
        const roleTable = await db.query(`
            SELECT id, title 
            FROM role
            ORDER BY title ASC`); 

        let roleArray = roleTable.map(role => ({
            name: role.title,
            value: role.id
        }));

        questions.addEmployee.push(constructListQuestion("Choose a role for this employee", "role", roleArray));
    
    } catch (err) {
        console.log(err);
    }

    try {
        const managerTable = await db.query(`
            SELECT e.id, CONCAT(first_name, ' ', last_name, ' TITLE ', title) AS name
            FROM employee e
            JOIN role r 
                ON e.role_id = r.id    
            WHERE manager_id IS NULL
            ORDER BY name ASC`);

        let managerArray = managerTable.map(manager => ({
            name: manager.name,
            value: manager.id
        }));

        managerArray.push({
            name: "No Manager",
            value: null
        });

        questions.addEmployee.push(constructListQuestion("Choose a manager for this employee", "manager", managerArray));
           
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(questions.addEmployee)
        .then(async (addEmployeeAnswers) => {

            const { first_name, last_name, role, manager } = addEmployeeAnswers;

            try {
                await db.query(`
                    INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                    VALUES (?, ?, ?, ?)`, [first_name, last_name, role, manager]); 
                    
                console.log('\x1b[32m', `Added ${first_name} ${last_name} to the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });    
}

// Updates an employee's role
const updateEmployeeRole = async () => {
    let updateEmployeeRoleQuestions = [];

    try {
        const employeeTable = await db.query(`        
            SELECT e.id, CONCAT(first_name, ' ', last_name, ' TITLE ', title) AS name
            FROM employee e
            JOIN role r 
                ON e.role_id = r.id    
            ORDER BY title ASC, name ASC`); 

        let employeeArray = employeeTable.map(employee => ({
            name: employee.name,
            value: employee.id
        }));

        updateEmployeeRoleQuestions.push(constructListQuestion("Choose an employee to update thier role", "employee", employeeArray));

    } catch (err) {
        console.log(err);
    }

    try {
        const roleTable = await db.query(`
            SELECT id, title 
            FROM role
            ORDER BY title ASC`); 
    
        let roleArray = roleTable.map(role => ({
            name: role.title,
            value: role.id
        }));

        updateEmployeeRoleQuestions.push(constructListQuestion("Choose a new role for this employee", "role", roleArray));
    
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(updateEmployeeRoleQuestions)
        .then(async (updateEmployeeAnswers) => {

            const { role, employee } = updateEmployeeAnswers;

            try {
                await db.query(`
                    UPDATE employee
                    SET role_id = ?
                    WHERE id = ?`, [role, employee]);

                console.log('\x1b[32m', `Updated employee's role in the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Updates an employee's manager
const updateEmployeeManager = async () => {
    let updateEmployeeManagerQuestions = [];

    try {
        const employeeTable = await db.query(`        
            SELECT e.id, CONCAT(first_name, ' ', last_name, ' TITLE ', title) AS name
            FROM employee e
            JOIN role r 
                ON e.role_id = r.id    
            ORDER BY name ASC`); 

        let employeeArray = employeeTable.map(employee => ({
            name: employee.name,
            value: employee.id
        }));

        updateEmployeeManagerQuestions.push(constructListQuestion("Choose an employee to update thier manager", "employee", employeeArray));
        updateEmployeeManagerQuestions.push(constructListQuestion("Choose a new manager for this employee. (Choosing the same employee sets the manager to no one)", "manager", employeeArray));

    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(updateEmployeeManagerQuestions)
        .then(async (updateEmployeeAnswers) => {

            let { manager, employee } = updateEmployeeAnswers;

            if( manager === employee ) manager = null;

            try {
                await db.query(`
                    UPDATE employee
                    SET manager_id = ?
                    WHERE id = ?`, [manager, employee]);

                console.log('\x1b[32m', `Updated employee's manager in the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Ask the user for what action they want to take with employees
const AskForEmployeeAction = () => {
    inquirer
        .prompt(questions.employee)
        .then((employeeAnswer) => {

            switch(employeeAnswer.action) {

                case "View All Employees":
                    return selectEmployeeTable();

                case "View Employees by Manager":
                    return selectEmployeeManagerTable();

                case "View Employees by Department":
                    return selectEmployeeDepartmentTable();

                case "Add An Employee":
                    return addEmployee();

                case "Update An Employee's Role":
                    return updateEmployeeRole();

                case "Update An Employee's Manager":
                    return updateEmployeeManager();
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