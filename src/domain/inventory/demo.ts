// Demo script to test the ingredient system
import { STARTER_INGREDIENTS, IngredientService, IngredientAmount } from './index';

export function testIngredientSystem(): void {
  console.log('🧪 Testing Ingredient System...');
  
  // Reset to clean state for demo
  localStorage.removeItem('bakewatt-pantry');
  
  // Create ingredient service (will initialize with starter pantry)
  const service = new IngredientService();
  const pantry = service.getPantry();
  
  console.log('📦 Initial Pantry State:');
  service.getAllIngredientAmounts().forEach(amount => {
    console.log(`  - ${amount.toDisplayString()}`);
  });
  
  // Test ingredient transfer (subtraction math)
  console.log('\n🔢 Testing Subtraction: Transfer 6 cups flour from pantry');
  
  console.log(`Before: ${service.getIngredientAmount('flour')?.toDisplayString()}`);
  
  try {
    service.removeFromPantry('flour', 6);
    console.log(`After: ${service.getIngredientAmount('flour')?.toDisplayString()}`);
  } catch (error) {
    console.warn(`⚠️ Cannot transfer: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`Pantry unchanged: ${service.getIngredientAmount('flour')?.toDisplayString()}`);
  }
  
  // Test ingredient addition
  console.log('\n➕ Testing Addition: Add 5 cups flour back to pantry');
  console.log(`Before: ${service.getIngredientAmount('flour')?.toDisplayString()}`);
  service.addToPantry('flour', 5);
  console.log(`After: ${service.getIngredientAmount('flour')?.toDisplayString()}`);
  
  // Test recipe ingredient requirements
  console.log('\n🍪 Testing Recipe Requirements (Simple Cookies × 3):');
  const recipeRequirements = [
    new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 6),  // 2 × 3 = 6
    new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 3), // 1 × 3 = 3
    new IngredientAmount(STARTER_INGREDIENTS.EGGS, 3)    // 1 × 3 = 3
  ];
  
  console.log('Recipe needs:');
  recipeRequirements.forEach(req => {
    console.log(`  - ${req.toDisplayString()}`);
  });
  
  const canMake = pantry.canSupport(recipeRequirements);
  console.log(`Can make recipe: ${canMake ? '✅ Yes' : '❌ No'}`);
  
  if (canMake) {
    console.log('\n🎯 Transferring ingredients for recipe...');
    try {
      service.transferIngredients(recipeRequirements);
      
      console.log('Updated pantry:');
      service.getAllIngredientAmounts().forEach(amount => {
        console.log(`  - ${amount.toDisplayString()}`);
      });
    } catch (error) {
      console.warn(`⚠️ Cannot complete recipe transfer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log('\n✅ Ingredient System Test Complete!');
}