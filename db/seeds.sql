INSERT INTO department (id, name)
VALUES  (1, "Finance"),
        (2, "Marketing"),
        (3, "Engineering");

INSERT INTO role (id, title, salary, department_id)
VALUES  (1, "Accountant", 100000, 1),
        (2, "Data Analyst", 120000, 1),
        (3, "Finance Lead", 140000, 1),
        (4, "Photo Editor", 60000, 2),
        (5, "Graphic Designer", 80000, 2),
        (6, "Creative Director", 120000, 2),
        (7, "Intern", 40000, 3),
        (8, "Full-stack Developer", 100000, 3),
        (9, "Senior Engineer", 130000, 3);

INSERT INTO employee (id, first_name, last_name, role_id, manager_id)
VALUES  (3, "Alex", "Marigold", 3, NULL),
        (1, "Tom", "Hush", 1, 3),
        (2, "Jen", "Xi", 2, 3),
        (7, "Benjamin", "Williams", 6, NULL),
        (4, "Paul", "Odo", 4, 7),
        (5, "Amy", "Svenson", 4, 7),
        (6, "Luca", "Protolii", 5, 7),
        (10, "Audrionna", "Ramos", 9, NULL),
        (8, "William", "Crownover", 7, 10),
        (9, "Carolyn", "Magos", 8, 10);