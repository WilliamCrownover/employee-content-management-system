// Required modules
require('dotenv').config();
const inquirer = require('inquirer');
const mysql = require('mysql2');
const util = require('util');
const questions = require('./assets/questions');
const queries = require('./assets/queries');

// Connect to the employees_db
const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASS,
      database: 'employees_db'
    },
);

// Turn database queries into a promise
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
        const table = await db.query(queries.departments);
    
        viewTable(table);

        return askForCategory();

    } catch (err) {
        console.log(err);
    }
}

// Sum a department's budget
const selectDepartmentBudgetTable = async () => {
    let chooseDepartmentQuestions  = [];

    try {
        const table = await db.query(queries.departments);

        let deptArray = table.map(dept => ({
            name: dept.name,
            value: dept.id
        }));

        chooseDepartmentQuestions.push(constructListQuestion("Choose a department to view budget", "department", deptArray));
    
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(chooseDepartmentQuestions)
        .then(async (choosenDepartment) => {

            const department = choosenDepartment.department;

            try {
                const budgetTable = await db.query(queries.budget, department);
                    
                if(budgetTable[0].department === null) {
                    console.log('\x1b[32m', `This department has no employees.`, '\x1b[0m');
                } else {
                    viewTable(budgetTable);
                }

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Add a department to database
const addDepartment = () => {
    inquirer
        .prompt(questions.addDepartment)
        .then(async (addDepartmentAnswer) => {

            const deptName = addDepartmentAnswer.name;
            
            try {
                await db.query(queries.insertDepartment, deptName);
                                    
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
        const table = await db.query(queries.departments);

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
                await db.query(queries.delete('department'), department);
                    
                console.log('\x1b[33m', `Deleted department from the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Ask the user for what action they want to take with departments
const askForDepartmentAction = () => {
    inquirer
        .prompt(questions.department)
        .then((departmentAnswer) => {

            switch(departmentAnswer.action) {

                case "View All Departments":
                    return selectDepartmentTable();

                case "View Department Budget":
                    return selectDepartmentBudgetTable();

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
        const table = await db.query(queries.roles); 
            
        viewTable(table);

        return askForCategory();

    } catch (err) {
        console.log(err);
    }
}

// Add a role to database
const addRole = async () => {
    try {
        const deptTable = await db.query(queries.departments); 

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
                await db.query(queries.insertRole, [title, salary, department]);
                    
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
        const table = await db.query(queries.roles);

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
                await db.query(queries.delete('role'), role);
                    
                console.log('\x1b[33m', `Deleted role from the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Ask the user for what action they want to take with roles
const askForRoleAction = () => {
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
        const table = await db.query(queries.employees()); 
        
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
        const managerTable = await db.query(queries.managers); 

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
                const table = await db.query(queries.employeesByManager(), manager); 
                
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
        const deptTable = await db.query(queries.departments); 

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
                const table = await db.query(queries.employeesByDepartment(), department);
                    
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
        const roleTable = await db.query(queries.roles); 

        let roleArray = roleTable.map(role => ({
            name: role.title,
            value: role.id
        }));

        questions.addEmployee.push(constructListQuestion("Choose a role for this employee", "role", roleArray));
    
    } catch (err) {
        console.log(err);
    }

    try {
        const managerTable = await db.query(queries.managers);

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
                await db.query(queries.insertEmployee, [first_name, last_name, role, manager]); 
                    
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
        const employeeTable = await db.query(queries.employeesByRole); 

        let employeeArray = employeeTable.map(employee => ({
            name: employee.name,
            value: employee.id
        }));

        updateEmployeeRoleQuestions.push(constructListQuestion("Choose an employee to update thier role", "employee", employeeArray));

    } catch (err) {
        console.log(err);
    }

    try {
        const roleTable = await db.query(queries.roles); 
    
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
                await db.query(queries.updateEmployee('role'), [role, employee]);

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
        const employeeTable = await db.query(queries.employeesByRole); 

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
                await db.query(queries.updateEmployee('manager'), [manager, employee]);

                console.log('\x1b[32m', `Updated employee's manager in the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Remove an employee
const deleteEmployee = async () => {
    let chooseEmployeeQuestions  = [];

    try {
        const table = await db.query(queries.employeesByRole);

        let employeeArray = table.map(employee => ({
            name: employee.name,
            value: employee.id
        }));

        chooseEmployeeQuestions.push(constructListQuestion("Choose an employee to delete", "employee", employeeArray));
    
    } catch (err) {
        console.log(err);
    }

    inquirer
        .prompt(chooseEmployeeQuestions)
        .then(async (choosenEmployee) => {

            const employee = choosenEmployee.employee;

            try {
                await db.query(queries.delete('employee'), employee);
                    
                console.log('\x1b[33m', `Deleted employee from the database.`, '\x1b[0m');

                return askForCategory();

            } catch (err) {
                console.log(err);
            }
        });
}

// Ask the user for what action they want to take with employees
const askForEmployeeAction = () => {
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

                case "Delete An Employee":
                    return deleteEmployee();
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
                    return askForDepartmentAction();

                case "Roles":
                    return askForRoleAction();

                case "Employees":
                    return askForEmployeeAction();

                case "Quit":
                    console.log('\x1b[34m', 'Goodbye!', '\x1b[0m');
                    return db.end();
            }
        });
}

askForCategory();