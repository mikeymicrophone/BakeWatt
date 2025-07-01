## Game Flow

### 0. Proof of Concept Pages

#### 0.1. Pantry Page

The pantry page is a simple page that displays a list of ingredients in the pantry.

It allows the player to select an ingredient, select a quantity, and move that quantity to the counter.  However, this move does not correspond to the counter that we use while proceeding in the current recipe flow.

When moving an ingredient, there is a substraction illustration animation which is important.  This should be adopted by other parts of the app.

**Key Files**
- `src/domain/inventory/Pantry.ts` - Core pantry state management
- `src/presentation/scenes/SubtractionMathScene.ts` - Transfer animations  
- `src/domain/inventory/IngredientService.ts` - Ingredient operations
- `src/core/engine/Application.ts` - Main app coordination

**Key Functions**
- `addIngredient(ingredientId, amount)` - Add ingredients to pantry
- `removeIngredient(ingredientId, amount)` - Remove ingredients from pantry  
- `getStock(ingredientId)` - Get current pantry stock levels
- `transferIngredient(ingredientId, amount)` - Transfer ingredients to baking counter
- `updatePantryDisplay()` - Refresh pantry UI display
- `createIngredientTransferProblem()` - Generate math problems for transfers

**Key HTML Elements and their Behaviors**
- `#pantry-items.inventory-grid` - Clickable ingredient cards that trigger selection
- `#counter-items.inventory-grid` - Display area showing transferred ingredients  
- `#transfer-amount` - Number input for quantity with min/max validation
- `#visualize-transfer-btn` - Triggers 3D subtraction animation in three-container
- `#confirm-transfer-btn` - Executes transfer and updates both pantry and counter
- `#subtraction-equation` - Live-updating math display showing pantry - transfer = remaining



#### 0.2. Multiplication Page with Three.js

The multiplication page is a page that displays a multiplication problem.

This is our initial concept and accomplishes a few important goals.

1. It illustrates the multiplication problem using one of the most relevant metaphors for learning.
2. It provides more detail when zoomed in.
3. It uses parallax to create a more immersive experience.

While this interface has not spread across the application yet, it should be used and expanded soon.

**Key Files**
- `src/core/math/MultiplicationService.ts` - Multiplication problem generation
- `src/presentation/components/CubeGrid.ts` - 3D cube grid visualization
- `src/core/engine/CameraZoomManager.ts` - Camera zoom and parallax effects
- `src/core/engine/SceneManager.ts` - Three.js scene management

**Key Functions**
- `createProblem(factor1, factor2)` - Generate multiplication problems
- `createGrid(rows, columns)` - Create 3D cube grid visualization
- `setZoomLevel(level, animated)` - Handle camera zoom and parallax
- `getVisualizationDimensions()` - Calculate grid layout from factors
- `showResult()` / `hideResult()` - Toggle problem solution display
- `updateNumberVisibility()` - Show/hide cube numbers based on zoom

**Key HTML Elements and their Behaviors**
- `#factor1, #factor2` - Number inputs (1-20) that trigger grid regeneration on change
- `#visualize-btn` - Creates 3D cube grid in #three-container with factor1×factor2 layout
- `#calculate-btn` - Shows/hides result equation overlay on the 3D scene
- `#zoom-slider` - Range input (0.3-8) controlling camera distance with live zoom value display
- `#zoom-value` - Span showing current zoom level (e.g., "1.0x", "2.5x")
- `#result.result-display` - Hidden div that shows equation when calculate button clicked


### 1. Recipe Index Page

The recipe index page is a page that displays a list of recipes.

The recipes the player owns are displayed.  The user can either view details about the ingredients needed for each step, or begin the baking process (if they have all the ingredients).

**Key Files**
- `src/presentation/ui/UIManager.ts` - Recipe display and interaction
- `src/domain/baking/RecipeLibrary.ts` - Recipe collection management
- `src/domain/baking/RecipeCollection.ts` - Recipe organization
- `src/core/engine/Application.ts` - Recipe availability checking

**Key Functions**
- `populateRecipeCollection(recipes, gameState)` - Display recipe cards
- `canMakeRecipeAtCurrentScale(recipe)` - Check ingredient availability
- `sortRecipes(sortBy)` - Sort recipes by name/difficulty/time
- `filterRecipes(filterBy)` - Filter by difficulty/ownership
- `displaySortedRecipes(recipes)` - Render filtered recipe list
- `showRecipeDetails(recipeId)` - Open recipe detail modal

**Key HTML Elements and their Behaviors**
- `#recipe-sort` - Select dropdown that triggers recipe reordering by name/difficulty/time
- `#recipe-filter` - Select dropdown that filters recipes by ownership/difficulty
- `#recipe-grid` - Container populated with dynamically generated recipe cards
- `.recipe-card` - Clickable cards with hover effects that open recipe detail modal
- `#btn-recipe-shop` - Button to access recipe purchasing interface
- `.recipe-card .btn-start-cooking` - Enabled/disabled based on ingredient availability


### 2. Recipe Detail Page

The recipe detail page shows the steps and substeps of the recipe.  For each step that needs ingredients, a color-coded list of ingredients is displayed.  If the pantry has enough of the ingredient for 2x the recipe, the color used is blue.  If it has 1-2x, it is green, and less than 1x, it is red.

This is done because on this page the recipe can be doubled.  There is a quirk which comes into play if a single ingredient is used in more than one step.

When the recipe is doubled, an equation for the updated yield of servings is displayed.  The scale factor is persisted so that when the user begins the recipe later, the scale factor is applied to the recipe.  The doubling can be done multiple times, and halving the recipe is also supported.  There is currently no support for tripling or anything more fine-grained.


**Key Files**
- `src/presentation/ui/UIManager.ts` - Recipe detail modal management
- `src/domain/baking/RecipeLibrary.ts` - Recipe data and scaling logic
- `src/domain/baking/RecipeCollection.ts` - Recipe availability checking
- `src/core/engine/Application.ts` - Recipe scaling coordination
- `src/domain/nutrition/NutritionCalculator.ts` - Ingredient nutrition calculation

**Key Functions**
- `openRecipeDetails(recipeId)` - Display recipe detail modal
- `updateRecipeScaling(scalingFactor)` - Handle recipe doubling/halving
- `populateRecipeIngredients(recipe, scalingFactor)` - Display scaled ingredients
- `checkIngredientAvailability(ingredientId, amount)` - Color-code ingredient availability
- `calculateScaledNutrition(recipe, scalingFactor)` - Scale nutrition values
- `canMakeRecipeAtCurrentScale(recipe)` - Validate if recipe can be made

**Key HTML Elements and their Behaviors**
- `#recipe-details-close` - X button that closes modal and returns to recipe index
- `#btn-halve-recipe, #btn-double-recipe` - Scaling buttons that update servings with ½x and 2x
- `#current-servings` - Live display of current serving count that updates with scaling
- `#scaling-equation` - Math display showing base servings × factor = new servings
- `#recipe-details-ingredients` - Container with color-coded ingredient availability (red/green/blue)
- `#recipe-details-steps` - Numbered step list with substep details and time estimates


### 3. Recipe Production Page

The recipe production page is a page that displays a list of ingredients that need to be moved to the counter.

There is currently no need to select a quantity, except for flexible-amount ingredients.  Simply pressing Transfer moves the needed amount to the counter.

For flexible amount ingredients, the amount is selected by picking two factors to multiply together.  Currently the single-digit integers are used, and this seems to work well even when doubling our recipes.  At some point this will need to be nuanced, perhaps by adding a third multiplication factor.

Once all ingredients for the step are transferred, a Proceed button is highlighted.  If no ingredients are needed for that step, Proceed is still used.


**Key Files**
- `src/core/engine/Application.ts` - Recipe step coordination and ingredient transfer
- `src/presentation/components/FlexibleIngredientGrid.ts` - Grid-based ingredient amount selection
- `src/domain/inventory/IngredientService.ts` - Ingredient availability and transfer logic
- `src/domain/baking/RecipeLibrary.ts` - Recipe step management
- `src/presentation/ui/UIManager.ts` - Cooking panel UI management

**Key Functions**
- `startCooking(recipe, scalingFactor)` - Begin recipe production process
- `populateIngredientZones(recipeStep)` - Display required ingredients for current step
- `transferIngredient(ingredientId, amount)` - Move ingredient from pantry to counter
- `setupFlexibleIngredientEvents()` - Handle grid-based amount selection
- `checkStepCompletion()` - Validate all ingredients transferred for current step
- `proceedToNextStep()` - Advance to next recipe step or finish cooking

**Key HTML Elements and their Behaviors**
- `#ingredient-zones-list` - Container with ingredient requirement cards for current step
- `flexible-ingredient-grid` - Custom Lit components with interactive 10×10 grid visualization
- `.grid-slider` - Range inputs (1-10) for width/height that update grid dimensions in real-time
- `.btn-transfer` - Buttons that become enabled when ingredient amount is valid
- `#btn-proceed` - Step advancement button that enables when all ingredients transferred
- `#baking-counter-grid` - Visual display of all transferred ingredients for current step


### 4. Packaging Page

On the packaging page, the user is presented with the gross yield of their baking.  They decide how to subdivide the yield into pieces, and how to collect the pieces into packages.  These decisions impact the resulting price of the packages.

The equations illustrating their decision are displayed.  The first represents a multiplication, and the second represents a division with a remainder.


**Key Files**
- `src/domain/production/ProductionService.ts` - Production workflow and packaging logic
- `src/core/engine/Application.ts` - Production interface coordination
- `src/domain/store/Store.ts` - Package creation and pricing
- `src/domain/baking/RecipeLibrary.ts` - Recipe yield calculation
- `src/domain/nutrition/NutritionCalculator.ts` - Nutrition scaling for final products

**Key Functions**
- `startProduction(recipe, scalingFactor)` - Initialize packaging interface
- `updateCuttingAmount(value)` - Adjust pieces per item calculation
- `updatePackagingAmount(value)` - Adjust pieces per package calculation
- `finishProduction()` - Create packages and add to store inventory
- `updateProductionVisuals()` - Display cutting and packaging visualizations
- `calculateBasePrice(recipe, productionData)` - Determine package pricing

**Key HTML Elements and their Behaviors**
- `#cutting-slider` - Range input (1-50) controlling pieces per item with live value display
- `#packaging-slider` - Range input (1-12) controlling pieces per package with live value display  
- `#initial-math, #cutting-math, #packaging-math` - Live-updating equation displays
- `#initial-items, #pieces-after-cutting, #packages-after-packaging` - Visual item grids that update with sliders
- `#btn-finish-production` - Creates packages and adds them to store inventory
- `#total-math-equation` - Comprehensive equation showing items × pieces/item ÷ pieces/package = packages


### 5. Store Page

The store page allows the user to sell their packages.  The sell button sells one package.  Previously there was a quantity selector that would allow multiple packages to be sold at the same price.

Pricing factors are displayed, but there are some that have not been displayed yet.


**Key Files**
- `src/domain/store/Store.ts` - Store inventory and sales management
- `src/domain/store/StoreItem.ts` - Item properties and sale logic
- `src/presentation/components/StoreItemCard.ts` - Individual item display and interaction
- `src/domain/store/PricingEngine.ts` - Dynamic pricing calculations
- `src/core/engine/Application.ts` - Store interface coordination
- `src/presentation/ui/UIManager.ts` - Store panel management

**Key Functions**
- `sellItem(itemId, quantity)` - Process item sale and update revenue
- `sellSingleItem(itemId)` - Sell one item with single click
- `populateStoreInventory()` - Display all available items for sale
- `calculatePrice(item)` - Apply dynamic pricing modifiers
- `showPricingInfo(itemId)` - Display pricing factor breakdown
- `getItemsWithPrices()` - Get all items with current market prices

**Key HTML Elements and their Behaviors**
- `#location-select` - Dropdown that changes pricing modifiers for all items
- `#total-revenue, #items-in-stock, #store-value` - Live-updating stat displays
- `#baked-goods-grid, #packages-grid, #ingredients-grid` - Item category containers
- `store-item-card` - Custom Lit components with sell buttons and pricing info
- `.pricing-modifiers` - Percentage displays showing time/demand/location/freshness factors
- `#sales-notification` - Toast notification that appears briefly after successful sales



### 6. Supplier Page

This is where the user can purchase ingredients from suppliers.

For each ingredient, there are three options for the quantity to purchase.

**Key Files**
- `src/core/engine/Application.ts` - Supplier interface and purchase coordination
- `src/domain/inventory/IngredientService.ts` - Ingredient availability and purchasing
- `src/domain/inventory/Pantry.ts` - Pantry stock management
- `src/domain/store/Store.ts` - Revenue deduction for purchases
- `src/presentation/ui/UIManager.ts` - Supplier panel management
- `src/domain/inventory/Ingredient.ts` - Base ingredient definitions

**Key Functions**
- `populateSupplierInventory()` - Display available ingredients for purchase
- `purchaseIngredient(ingredientId, quantity)` - Buy ingredients and add to pantry
- `calculateBulkPricing(quantity)` - Apply bulk discount pricing
- `deductMoney(amount)` - Process payment from store revenue
- `addToPantry(ingredientId, amount)` - Add purchased ingredients to inventory
- `updateSupplierStats()` - Display purchase statistics and available funds

**Key HTML Elements and their Behaviors**
- `#available-coins, #todays-orders, #bulk-savings` - Live-updating financial stat displays
- `.pricing-tier` - Visual pricing guides showing 1-unit, 10-pack, and 100-pack discounts
- `#supplier-items-grid` - Container populated with ingredient purchase cards
- `.supplier-item-card` - Cards with quantity options (1, 10, 100) and buy buttons
- `.quantity-option` - Buttons showing unit price and total cost that update available funds
- `.btn-purchase` - Buttons that become disabled when insufficient funds

