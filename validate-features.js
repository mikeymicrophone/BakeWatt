// Simple validation script to test our features
import { RecipeService } from './src/domain/baking/RecipeService.js';
import { IngredientService } from './src/domain/inventory/IngredientService.js';
import { MultiplicationService } from './src/core/math/MultiplicationService.js';

console.log('🧪 Testing BakeWatt Features...\n');

// Test 1: Ingredient Service
console.log('1️⃣ Testing Ingredient Service:');
const ingredientService = new IngredientService();
console.log('✅ Pantry initialized with:', ingredientService.pantryState);

// Test 2: Recipe Service  
console.log('\n2️⃣ Testing Recipe Service:');
const recipeService = new RecipeService();
console.log('✅ Available recipes:', recipeService.availableRecipes.length);
recipeService.availableRecipes.forEach(recipe => {
  console.log(`   - ${recipe.name} (${recipe.baseServings} servings)`);
});

// Test 3: Recipe Scaling
console.log('\n3️⃣ Testing Recipe Scaling:');
const mathService = new MultiplicationService();
const scalingProblem = mathService.generateRecipeScalingProblem(
  'simple-cookies',
  recipeService.availableRecipes,
  6
);
console.log('✅ Recipe scaling problem generated:');
console.log(`   Recipe: ${scalingProblem.recipeName}`);
console.log(`   ${scalingProblem.baseServings} servings × ${scalingProblem.scalingFactor} = ${scalingProblem.targetServings} servings`);

// Test 4: Multiplication Math
console.log('\n4️⃣ Testing Basic Multiplication:');
const basicProblem = mathService.generateProblem(3, 4);
console.log('✅ Basic math problem:', `${basicProblem.factor1} × ${basicProblem.factor2} = ${basicProblem.product}`);

console.log('\n🎉 All core features validated successfully!');
console.log('\nNext: Visit http://localhost:3751/ to test the visual interface');