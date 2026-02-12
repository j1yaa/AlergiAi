import { 
  loadReminders, 
  saveReminders, 
  scheduleReminder,
  MealReminder 
} from '../reminderService';

// Test reminder service
export const testReminderService = async () => {
  console.log('🧪 Testing Reminder Service...');
  
  try {
    // Test 1: Load default reminders
    console.log('Test 1: Loading reminders...');
    const reminders = await loadReminders();
    console.log('✅ Loaded reminders:', reminders.length);
    
    // Test 2: Update a reminder
    console.log('Test 2: Updating reminder...');
    const testReminder: MealReminder = {
      id: '1',
      mealType: 'breakfast',
      time: '08:00',
      enabled: true
    };
    await saveReminders([testReminder]);
    console.log('✅ Reminder saved');
    
    // Test 3: Schedule notification
    console.log('Test 3: Scheduling notification...');
    await scheduleReminder(testReminder);
    console.log('✅ Notification scheduled');
    
    console.log('🎉 All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};
