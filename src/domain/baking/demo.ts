// Demo script to test the recipe system
import { RecipeService, RecipeLibrary, SIMPLE_COOKIES_RECIPE } from './index';
import { IngredientService } from '@/domain/inventory';

export function testRecipeSystem(): void {
  console.log('🍪 Testing Recipe System...');
  
  // Create services
  const recipeService = new RecipeService();
  const ingredientService = new IngredientService();
  const pantry = ingredientService.getPantry();
  
  console.log('📚 Initial Recipe Collection:');
  recipeService.getAllRecipes().forEach(recipe => {
    console.log(`  - ${recipe.toString()}`);
  });
  
  // Test recipe scaling (multiplication math)
  console.log('\n🔢 Testing Multiplication: Scale Simple Cookies from 2 to 6 servings');
  const baseRecipe = SIMPLE_COOKIES_RECIPE;
  console.log(`Base recipe: ${baseRecipe.toString()}`);
  console.log('Base ingredients:');
  baseRecipe.ingredients.forEach(ing => {
    console.log(`  - ${ing.toDisplayString()}`);
  });
  
  const scaledRecipe = recipeService.scaleRecipe('simple-cookies', 6);
  const scalingFactor = recipeService.getScalingFactor('simple-cookies', 6);
  console.log(`\nScaling factor: ${baseRecipe.baseServings} × ${scalingFactor} = ${scaledRecipe.baseServings}`);
  console.log('Scaled ingredients:');
  scaledRecipe.ingredients.forEach(ing => {
    console.log(`  - ${ing.toDisplayString()}`);
  });
  
  // Test recipe availability checking
  console.log('\n📦 Testing Recipe Availability:');
  const canMake = recipeService.canMakeRecipe('simple-cookies', pantry);
  console.log(`Can make Simple Cookies: ${canMake ? '✅ Yes' : '❌ No'}`);
  
  if (canMake) {
    const validation = recipeService.validateRecipeRequirements('simple-cookies', pantry);
    console.log('Available ingredients:');
    validation.availableIngredients.forEach(ing => {
      console.log(`  - ${ing.toDisplayString()}`);
    });
  }
  
  // Test multi-recipe planning (addition math)
  console.log('\n➕ Testing Addition: Plan multiple recipes');
  
  // Add another recipe to collection for demo
  try {
    recipeService.addRecipe('chocolate-muffins');
    console.log('Added Chocolate Muffins to collection');
  } catch (error) {
    console.log('Muffins already in collection or error:', error instanceof Error ? error.message : String(error));
  }
  
  const additionProblem = recipeService.createAdditionProblem(['simple-cookies', 'chocolate-muffins']);
  console.log('Combining recipes:');
  additionProblem.recipes.forEach(recipe => {
    console.log(`  - ${recipe.name} (${recipe.baseServings} servings)`);
  });
  
  console.log('Ingredient additions:');
  additionProblem.ingredientAdditions.forEach(addition => {
    console.log(`  - ${addition.mathDescription}`);
  });
  
  console.log(`Total servings: ${additionProblem.totalServings}`);
  
  // Test recipe library validation
  console.log('\n🔍 Testing Recipe Library Validation:');
  const validation = RecipeLibrary.validateLibrary();
  console.log(`Library valid: ${validation.isValid ? '✅ Yes' : '❌ No'}`);
  if (!validation.isValid) {
    validation.errors.forEach(error => console.log(`  - Error: ${error}`));
  }
  
  // Test math problem generation
  console.log('\n🧮 Testing Math Problem Generation:');
  const multiplicationProblem = recipeService.createMultiplicationProblem('simple-cookies', 8);
  console.log(`Multiplication problem: ${multiplicationProblem.mathDescription}`);
  
  console.log('\n✅ Recipe System Test Complete!');
}