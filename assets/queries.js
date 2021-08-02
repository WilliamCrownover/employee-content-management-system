// MySQL Queries
const queries = {
    departments: `
        SELECT * 
        FROM department 
        ORDER BY name ASC`,
    
    budget: `
        SELECT 
            name AS department,
            CONCAT('$', FORMAT(SUM(salary)/1000, 0), ' K') AS 'total budget'
        FROM employee e
        LEFT JOIN role r 
            ON e.role_id = r.id
        LEFT JOIN department d 
            ON r.department_id = d.id
        WHERE d.id = ?`,
    
    insertDepartment:`
        INSERT INTO department (name) 
        VALUES (?)`,

    delete: (table) => {
        return `
            DELETE FROM ${table} 
            WHERE id = ?`
    },

    roles:`
        SELECT 
            r.id, 
            title, 
            CONCAT('$', FORMAT(salary/1000, 0), ' K') AS salary, 
            name AS department 
        FROM role r 
        LEFT JOIN department d 
        ON r.department_id = d.id
        ORDER BY department ASC, salary*1 ASC`,

    insertRole:`
        INSERT INTO role (title, salary, department_id) 
        VALUES (?, ?, ?)`,

    employeeStart:`
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
            ON r.department_id = d.id`,

    employeeOrder:`
        ORDER BY department ASC, salary*1 DESC`,

    employees: function() { 
        return `${this.employeeStart} ${this.employeeOrder}`
    },

    managers:`        
        SELECT e.id, CONCAT(first_name, ' ', last_name, ' TITLE ', title) AS name
        FROM employee e
        JOIN role r 
            ON e.role_id = r.id    
        WHERE manager_id IS NULL
        ORDER BY name ASC`,

    employeesByManager: function() { 
        return `${this.employeeStart} WHERE e.manager_id = ? ${this.employeeOrder}`
    },

    employeesByDepartment: function() { 
        return `${this.employeeStart} WHERE r.department_id = ? ${this.employeeOrder}`
    },

    insertEmployee:`
        INSERT INTO employee (first_name, last_name, role_id, manager_id) 
        VALUES (?, ?, ?, ?)`,

    employeesByRole:`        
        SELECT e.id, CONCAT(first_name, ' ', last_name, ' TITLE ', title) AS name
        FROM employee e
        JOIN role r 
            ON e.role_id = r.id    
        ORDER BY title ASC, name ASC`,

    updateEmployee: (data) => {
        return `
            UPDATE employee
            SET ${data}_id = ?
            WHERE id = ?`
    }
}

module.exports = queries;