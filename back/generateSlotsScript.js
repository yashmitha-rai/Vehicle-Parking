const mongoose = require('mongoose');
const ParkingSlot = require('./models/ParkingSlot');

const mongoURL = "mongodb://localhost:27017/parking";

const generateSlots = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");

    // Check existing slots
    const existingCount = await ParkingSlot.countDocuments();
    console.log(`📊 Existing slots: ${existingCount}`);

    if (existingCount > 0) {
      console.log("ℹ️  Slots already exist. Skipping generation.");
      await mongoose.disconnect();
      return;
    }

    // Generate slots configuration
    const sections = ['A', 'B', 'C'];
    const rows = 4;
    const columns = 5;
    const slots = [];

    let slotCounter = 0;

    for (const section of sections) {
      for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= columns; col++) {
          const slotNumber = `${section}${row}${col.toString().padStart(2, '0')}`;
          
          // Determine slot type: First row has Emergency/Disabled, Second row has EV, rest are Normal
          let slotType = 'Normal';
          let vehicleTypes = ['Car'];
          let emergencyMode = false;
          let emergencyPriority = 0;
          let entryGate = 'Gate1';
          let chargingStation = null;
          let pricing = { baseRate: 25, peakHourRate: 38 };

          if (row === 1) {
            if (col === 1) {
              slotType = 'Emergency';
              vehicleTypes = ['Emergency'];
              emergencyMode = true;
              emergencyPriority = 3;
              entryGate = 'Emergency';
              pricing = { baseRate: 0, peakHourRate: 0 };
            } else if (col === 2) {
              slotType = 'Disabled';
              pricing = { baseRate: 20, peakHourRate: 30 };
            } else if (col <= 4) {
              slotType = 'EV';
              pricing = { baseRate: 30, peakHourRate: 45 };
              chargingStation = {
                available: true,
                powerOutput: '7.4kW',
                chargingStatus: 'idle',
                costPerHour: 35
              };
            }
          } else if (row === 2 && slotType === 'Normal') {
            // Second row: some EV slots
            if (col <= 3) {
              slotType = 'EV';
              pricing = { baseRate: 30, peakHourRate: 45 };
              chargingStation = {
                available: true,
                powerOutput: '7.4kW',
                chargingStatus: 'idle',
                costPerHour: 35
              };
            }
          }

          const newSlot = {
            slotNumber: slotNumber.toUpperCase(),
            slotType,
            section,
            position: { row, column: col },
            size: slotType === 'Normal' ? 'Medium' : 'Large',
            isOccupied: false,
            isActive: true,
            isReserved: false,
            vehicleTypes,
            entryGate: slotType === 'Emergency' ? 'Emergency' : 'Gate1',
            exitGate: 'Gate1',
            sensorStatus: 'online', // All sensors online
            pricing,
            amenities: ['CCTV', 'Security'],
            emergencyMode,
            emergencyPriority,
            dynamicPricing: {
              weekendMultiplier: slotType === 'Emergency' ? 1 : 1.5,
              holidayMultiplier: slotType === 'Emergency' ? 1 : 2.0,
              peakHours: { start: '18:00', end: '22:00' }
            }
          };

          if (chargingStation) {
            newSlot.chargingStation = chargingStation;
          }

          slots.push(newSlot);
          slotCounter++;
        }
      }
    }

    // Insert all slots
    await ParkingSlot.insertMany(slots);
    console.log(`✅ Successfully generated ${slotCounter} parking slots!`);

    // Show breakdown
    console.log("\n📊 Slot Breakdown:");
    console.log(`   Sections: ${sections.length} (${sections.join(', ')})`);
    console.log(`   Rows: ${rows} × Columns: ${columns} per section`);
    console.log(`   Total: ${slotCounter} slots`);

    // Count by type
    const typeCount = await ParkingSlot.aggregate([
      { $group: { _id: '$slotType', count: { $sum: 1 } } }
    ]);
    console.log("\n   By Type:");
    typeCount.forEach(t => console.log(`     ${t._id}: ${t.count}`));

    console.log("\n✨ Slots are now ready for booking!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
};

// Run the script
generateSlots();
