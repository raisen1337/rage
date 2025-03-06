import { Sequelize, DataTypes, Model, ModelStatic, WhereOptions, Op } from 'sequelize';
import { blueBright, greenBright, redBright } from 'colorette';

// Define ASCII colors for logging
const ascii_colors = {
    black: '\u001b[30m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    magenta: '\u001b[35m',
    cyan: '\u001b[36m',
    white: '\u001b[37m',
    reset: '\u001b[0m'
};

// Initialize Sequelize with MySQL connection
const sequelize = new Sequelize({
    dialect: 'mysql', // Use MySQL
    host: 'localhost',
    database: 'reversy',
    username: 'root',
    password: '',
    pool: {
        max: 10, // Connection limit
        min: 0,
        acquire: 10000, // Timeout in ms
        idle: 10000
    },
    logging: false // Set to true or a function for SQL logging
});

// Test the connection and log the result
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log(`${ascii_colors.green}Connected to the database via Sequelize.${ascii_colors.reset}`);
    } catch (error) {
        console.error(`${ascii_colors.red}Error connecting to the database:${ascii_colors.reset}`, error);
    }
}

testConnection();

// Define the Account model
class Account extends Model {
    declare id: number;
    declare name: string;
    declare license: string;
    declare cash: number;
    declare bank: number;
    declare position: string;
    declare inventory: string;
    declare character: string;
    declare licenses: string;
    declare faction: string;
    declare weapons: string;
    declare created_at: Date;
    declare updated_at: Date;
    declare last_login: Date;
    declare admin: number;
}

Account.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        license: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        cash: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        bank: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        position: {
            type: DataTypes.JSON,
            allowNull: false
        },
        inventory: {
            type: DataTypes.JSON,
            allowNull: false
        },
        character: {
            type: DataTypes.JSON,
            allowNull: false
        },
        licenses: {
            type: DataTypes.JSON,
            allowNull: false
        },
        faction: {
            type: DataTypes.JSON,
            allowNull: false
        },
        weapons: {
            type: DataTypes.JSON,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: 'CURRENT_TIMESTAMP'
        },
        last_login: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        dead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        deadTime: {
            type: DataTypes.INTEGER,
            defaultValue: 300
        },
        admin: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        sequelize,
        tableName: 'accounts',
        timestamps: false // Disable if you handle timestamps manually
    }
);
    
// Synchronize the model with the database
(async () => {
    await Account.sync({ force: false }); // Set force: true to drop and recreate
})();

//sequelize to create inventories table, with id, identifier, inventory(json(slots, weight, maxWeight, items))

// Define the Inventory model
class Inventories extends Model {
    declare id: number;
    declare identifier: string;
    declare inventory: {
        slots: number;
        weight: number;
        maxWeight: number;
        items: any[];
    };
}

Inventories.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        identifier: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        inventory: {
            type: DataTypes.JSON,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'inventories',
        timestamps: false // Disable if you handle timestamps manually
    }
);

// Synchronize the model with the database
(async () => {
    await Inventories.sync({ force: false }); // Set force: true to drop and recreate
})();


class VehicleShops extends Model {
    declare id: number;
    declare name: string;
    declare blip: number;
    declare blipColor: number;
    declare ped_pos: JSON;
    declare veh_pos: JSON;
    declare vehicles: JSON;
    declare testing_spots: JSON;
    declare created_at: Date;
    declare updated_at: Date;
}

VehicleShops.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        blip: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        blipColor: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ped_pos: {
            type: DataTypes.JSON,
            allowNull: false
        },
        veh_pos: {
            type: DataTypes.JSON,
            allowNull: false
        },
        vehicles: {
            type: DataTypes.JSON,
            allowNull: false
        },
        testing_spots: {
            type: DataTypes.JSON,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: 'CURRENT_TIMESTAMP'
        }
    },
    {
        sequelize,
        tableName: 'vehicle_shops',
        timestamps: false // Disable if you handle timestamps manually
    }
);

// Synchronize the model with the database
(async () => {
    await VehicleShops.sync({ force: false }); // Set force: true to drop and recreate
})();

// Define the Vehicle model
class Vehicles extends Model {
    declare id: number;
    declare model: string;
    declare label: string;
    declare plate: string;
    declare owner: string;
    declare mods: JSON;
    declare position: JSON;
    declare created_at: Date;
    declare updated_at: Date;
}

Vehicles.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        plate: {
            type: DataTypes.STRING,
            allowNull: false
        },
        owner: {
            type: DataTypes.STRING,
            allowNull: false
        },
        mods: {
            type: DataTypes.JSON,
            allowNull: false
        },
        position: {
            type: DataTypes.JSON,
            allowNull: false
        },
      
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: 'CURRENT_TIMESTAMP'
        }
    },
    {
        sequelize,
        tableName: 'owned_vehicles',
        timestamps: false // Disable if you handle timestamps manually
    }
);

class Blips extends Model {
    declare id: number;
    declare name: string;
    declare color: number;
    declare position: JSON;
    declare sprite: number;
    declare scale: number;
    declare shortRange: boolean;
    declare dimension: number;
    declare created_at: Date;
    declare updated_at: Date;
}

Blips.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        
        color: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        position: {
            type: DataTypes.JSON,
            allowNull: false
        },
        sprite: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        scale: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        shortRange: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        dimension: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: 'CURRENT_TIMESTAMP'
        }
    },
    {
        sequelize,
        tableName: 'blips',
        timestamps: false // Disable if you handle timestamps manually
    }
);

(async () => {
    await Blips.sync({ force: false });
})();

// Synchronize the model with the database
(async () => {
    await Vehicles.sync({ force: false }); // Set force: true to drop and recreate
})();

export { Inventories, VehicleShops, Vehicles, Blips };

// Export everything needed
export { sequelize, Account, Op }; // Export Op for query operators