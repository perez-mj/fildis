// backend/scripts/fixMaterialSchema.js
const mongoose = require('mongoose');
const path = require('path');

// Load env from the correct path (backend directory)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Material = require('../models/Material');

async function fixMaterials() {
    try {
        // Check if MONGO_URI exists
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env file');
            console.log('Current environment variables loaded:', Object.keys(process.env).filter(k => k.includes('MONGO')));
            process.exit(1);
        }
        
        console.log('Connecting to MongoDB...');
        console.log('MONGO_URI:', process.env.MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')); // Hide password
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully');
        
        // Find all materials with invalid aiReviewer
        const materials = await Material.find({
            $or: [
                { 'aiReviewer.questions.0': { $type: 'string' } },
                { 'aiReviewer.questions': { $type: 'string' } },
                { 'aiReviewer.questions': { $type: 'array' } } // This will help find proper ones too
            ]
        });
        
        console.log(`Found ${materials.length} materials with aiReviewer data`);
        
        let fixedCount = 0;
        for (const material of materials) {
            // Check if aiReviewer exists and has invalid structure
            if (material.aiReviewer && material.aiReviewer.questions) {
                const firstQuestion = material.aiReviewer.questions[0];
                
                // If first question is a string (invalid) or questions is not an array of objects
                if (typeof firstQuestion === 'string' || (firstQuestion && typeof firstQuestion === 'object' && !firstQuestion.type)) {
                    console.log(`Fixing material: ${material.title} (ID: ${material._id})`);
                    console.log(`  Current aiReviewer type: ${typeof material.aiReviewer.questions}`);
                    
                    // Clear the invalid aiReviewer
                    material.aiReviewer = undefined;
                    await material.save();
                    fixedCount++;
                    console.log(`  ✓ Fixed`);
                } else if (firstQuestion && firstQuestion.type) {
                    console.log(`Material "${material.title}" already has valid aiReviewer structure`);
                }
            }
        }
        
        console.log(`\n✅ Done! Fixed ${fixedCount} materials with invalid aiReviewer structure`);
        
        // Also find materials with no aiReviewer at all
        const materialsWithoutAI = await Material.find({ aiReviewer: { $exists: false } });
        console.log(`Materials without any aiReviewer: ${materialsWithoutAI.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixMaterials();