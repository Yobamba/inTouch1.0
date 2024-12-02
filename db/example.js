require('dotenv').config();
const { connectDB, createUser } = require('./connection');
const mongoose = require('mongoose');

// Example usage
async function example() {
    try {
        console.log("MONGO_URI from env:", process.env.MONGO_URI ? "Found" : "Not found");
        
        // Connect to database
        await connectDB();

        // Log current database and collection
        const db = mongoose.connection.db;
        console.log("\nDatabase Information:");
        console.log("Connected to database:", db.databaseName);
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log("Available collections:", collections.map(c => c.name).join(', '));

        // Create a user
        const userData = {
            username: "testMaster",
            password: "plaintextpassword123", // Will be automatically hashed
            email: "user39plus@example.com"
        };

        console.log("\nCreating user in Users collection...");
        const user = await createUser(userData);
        
        // Show detailed user creation result
        console.log('\nUser created successfully:');
        console.log('- ID:', user._id);
        console.log('- Username:', user.username);
        console.log('- Email:', user.email);
        console.log('- Created At:', user.createdAt);
        console.log('- Collection:', user.collection.name);

        // Count documents in Users collection
        const count = await db.collection('Users').countDocuments();
        console.log('\nTotal users in collection:', count);

    } catch (error) {
        console.error('\nError in example:', error);
    } finally {
        // Note: In a real application, you typically wouldn't close the connection
        // after each operation. The connection would be maintained for the lifetime
        // of the application.
        console.log('\nClosing connection...');
        await mongoose.connection.close();
        process.exit(0);
    }
}

// Run the example if this file is run directly
if (require.main === module) {
    example();
}

module.exports = example;
