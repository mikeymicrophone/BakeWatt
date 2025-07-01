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
- `selectIngredient(ingredientId)` - Select ingredient for transfer in SubtractionMathScene
- `visualizeTransfer()` - Create 3D subtraction visualization with cube animation
- `confirmTransfer()` - Execute ingredient transfer with validation
- `setTransferAmount(amount)` - Set transfer amount with min/max validation
- `updateSubtractionDisplay()` - Update live math equation display
- `stageIngredient(ingredient, amount)` - Stage ingredient on baking counter
- `meetsRecipeRequirements(requiredIngredients)` - Validate counter meets recipe needs
- `validateTransferAmount(transferAmount, availableAmount)` - Validate transfer legality

**Key HTML Elements and their Behaviors**
- `#pantry-items.inventory-grid` - Clickable ingredient cards that trigger selection
- `#counter-items.inventory-grid` - Display area showing transferred ingredients  
- `#transfer-amount` - Number input for quantity with min/max validation
- `#visualize-transfer-btn` - Triggers 3D subtraction animation in three-container
- `#confirm-transfer-btn` - Executes transfer and updates both pantry and counter
- `#subtraction-equation` - Live-updating math display showing pantry - transfer = remaining

**Colors and Emoji Used**
- **Colors**: Black background (#1a1a1a), blue accents (#007acc), green for success (#4caf50), red/orange for selected/errors (#ff6f61), yellow for math equations (#ffeb3b)
- **Emoji**: 📦 (pantry transfer), 🔥 (baking counter), 🌾 (flour), 🧄 (garlic), 🥄 (spices), ✅ (success), ❌ (error)
- **Visual States**: Blue hover effects, orange/red selection states, green availability indicators



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
- `createSubtractionGrid(totalAmount, removeAmount)` - Create subtraction visualization grid
- `animateSubtraction(removeAmount)` - Animate cube removal for subtraction
- `animateCubeIn(cube, delay)` - Animate individual cube appearance
- `createNumberedMaterial(text, baseColor)` - Create numbered cube materials
- `adjustCameraForGrid(rows, columns)` - Position camera for optimal viewing
- `clearGrid()` - Clear and dispose of all cube objects
- `formatResult(problem)` - Format mathematical result display
- `validateInput(value)` - Validate factor input ranges (1-20)

**Key HTML Elements and their Behaviors**
- `#factor1, #factor2` - Number inputs (1-20) that trigger grid regeneration on change
- `#visualize-btn` - Creates 3D cube grid in #three-container with factor1×factor2 layout
- `#calculate-btn` - Shows/hides result equation overlay on the 3D scene
- `#zoom-slider` - Range input (0.3-8) controlling camera distance with live zoom value display
- `#zoom-value` - Span showing current zoom level (e.g., "1.0x", "2.5x")
- `#result.result-display` - Hidden div that shows equation when calculate button clicked

**Colors and Emoji Used**
- **Colors**: Blue primary (#007acc), green calculate button (#28a745), gray inputs (#333), white text on dark background (#1a1a1a)
- **Emoji**: 🔢 (math practice tab icon), minimal emoji usage focused on functionality
- **Visual States**: Blue focus outlines, green result highlighting, subtle gray borders, button hover effects with slight vertical movement


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
- `openRecipeShop()` - Open recipe shop modal for purchasing new recipes
- `purchaseRecipe(recipeId, price)` - Purchase recipe from shop
- `getAvailableRecipes(gameState)` - Get purchasable recipes based on funds
- `canPurchaseRecipe(recipeId, gameState)` - Check recipe purchase eligibility
- `filterRecipesByCategory(category)` - Filter recipes by difficulty category
- `createRecipeShopModal()` - Create recipe shop interface
- `refreshRecipeShop()` - Refresh shop display after purchases
- `setupRecipeShopModal()` - Setup shop event listeners

**Key HTML Elements and their Behaviors**
- `#recipe-sort` - Select dropdown that triggers recipe reordering by name/difficulty/time
- `#recipe-filter` - Select dropdown that filters recipes by ownership/difficulty
- `#recipe-grid` - Container populated with dynamically generated recipe cards
- `.recipe-card` - Clickable cards with hover effects that open recipe detail modal
- `#btn-recipe-shop` - Button to access recipe purchasing interface
- `.recipe-card .btn-start-cooking` - Enabled/disabled based on ingredient availability

**Colors and Emoji Used**
- **Colors**: Blue primary buttons (#007acc), green recipe shop (#4caf50), purple advanced mode (#4834d4), orange medium difficulty (#ff9800), red hard difficulty (#f44336)
- **Emoji**: 📚 (recipe collection), 🛒 (recipe shop), 🔢 (advanced mode), 💾 (save), 📂 (load), 🍪 (various recipe icons)
- **Visual States**: Blue card hover effects, orange selection, difficulty color coding (green/orange/red), gradient buttons


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
- `showRecipeDetails(recipeId)` - Open modal and populate with recipe data
- `hideRecipeDetails()` - Close recipe detail modal
- `scaleRecipe(scalingMultiplier)` - Apply scaling multiplier (0.5, 2, etc.)
- `resetRecipeScaling()` - Reset recipe to original serving size
- `getRecipeScaling(recipeId)` - Get current scaling data for recipe
- `updateRecipeScalingDisplay()` - Update scaling equation display
- `updateIngredientAmounts()` - Recalculate ingredient amounts after scaling
- `getCurrentServings(recipeId)` - Get current serving count
- `populateRecipeDetailsModal(recipe)` - Fill modal with scaled ingredients and nutrition
- `setupRecipeDetailsModal()` - Setup modal event listeners and close functionality

**Key HTML Elements and their Behaviors**
- `#recipe-details-close` - X button that closes modal and returns to recipe index
- `#btn-halve-recipe, #btn-double-recipe` - Scaling buttons that update servings with ½x and 2x
- `#current-servings` - Live display of current serving count that updates with scaling
- `#scaling-equation` - Math display showing base servings × factor = new servings
- `#recipe-details-ingredients` - Container with color-coded ingredient availability (red/green/blue)
- `#recipe-details-steps` - Numbered step list with substep details and time estimates

**Colors and Emoji Used**
- **Colors**: Blue scaling buttons (#007acc), red insufficient ingredients (#f44336), green sufficient (2x+) (#4caf50), yellow adequate (1-2x) (#ffc107)
- **Emoji**: Recipe-specific icons (🍪🧁🍞), 🧄 (ingredients), 📋 (instructions), × (close modal)
- **Visual States**: Color-coded ingredient availability, blue step numbers, modal overlay with backdrop blur


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
- `showCookingStep(step)` - Display current cooking step interface
- `populateCookingStep(step)` - Populate step with ingredients and instructions
- `transferFlexibleIngredient(ingredientId)` - Transfer flexible ingredient using grid
- `transferFlexibleIngredientWithAmount(ingredientId, amount)` - Transfer specific flexible amount
- `updateFlexibleIngredientAmount(ingredientId, amount)` - Update flexible ingredient amount
- `handleFlexibleIngredientAmountChange(event)` - Handle amount change events
- `handleFlexibleIngredientTransfer(event)` - Handle transfer events from grid
- `updateBakingCounter()` - Refresh baking counter ingredient display
- `updateProceedButton()` - Enable/disable proceed button based on completion
- `completeCooking()` - Finish cooking and transition to production
- `cancelCooking()` - Cancel cooking process and return to recipes
- `createFlexibleComponent(flexIngredient)` - Create flexible ingredient grid component
- `updateExistingFlexibleComponent(component, flexIngredient)` - Update existing grid component

**Key HTML Elements and their Behaviors**
- `#ingredient-zones-list` - Container with ingredient requirement cards for current step
- `flexible-ingredient-grid` - Custom Lit components with interactive 10×10 grid visualization
- `.grid-slider` - Range inputs (1-10) for width/height that update grid dimensions in real-time
- `.btn-transfer` - Buttons that become enabled when ingredient amount is valid
- `#btn-proceed` - Step advancement button that enables when all ingredients transferred
- `#baking-counter-grid` - Visual display of all transferred ingredients for current step

**Colors and Emoji Used**
- **Colors**: Blue transfer buttons (#007acc), green transferred state (#4caf50), red insufficient (#ff6f61), yellow grid cells (#ffeb3b), purple grid selection overlay
- **Emoji**: Recipe icons (🍪), 🔥 (baking counter), ingredient-specific icons (🌾🧄🥄), grid visualization with colored cells
- **Visual States**: 10×10 grid with color-coded cells (minimum/maximum/selected), button state changes, step progression indicators


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
- `updateProductionStep()` - Recalculate production math (items → pieces → packages)
- `populateProductionInterface()` - Setup production UI with recipe data
- `hideProductionInterface()` - Close production interface
- `getRecipeProductionInfo(recipe)` - Get initial production items and terminology
- `getRecipeOutputTerm(recipe)` - Get recipe-specific output terminology
- `calculateNutritionFactor()` - Calculate nutrition-based pricing multiplier
- `calculateComplexityFactor()` - Calculate recipe complexity multiplier
- `calculateSophisticationFactor()` - Calculate ingredient balance multiplier
- `calculatePortioningFactor()` - Calculate portioning optimization multiplier
- `setupProductionSliders()` - Setup cutting and packaging slider controls

**Key HTML Elements and their Behaviors**
- `#cutting-slider` - Range input (1-50) controlling pieces per item with live value display
- `#packaging-slider` - Range input (1-12) controlling pieces per package with live value display  
- `#initial-math, #cutting-math, #packaging-math` - Live-updating equation displays
- `#initial-items, #pieces-after-cutting, #packages-after-packaging` - Visual item grids that update with sliders
- `#btn-finish-production` - Creates packages and adds them to store inventory
- `#total-math-equation` - Comprehensive equation showing items × pieces/item ÷ pieces/package = packages

**Colors and Emoji Used**
- **Colors**: Blue finish button (#007acc), yellow math equations, visual item representations with consistent iconography
- **Emoji**: 🍪 (finished items), 🔪 (cutting), 🎁 (packaging), 📦 (packages), 🔸 (individual pieces), production flow arrows →
- **Visual States**: Slider-controlled visual grids, math equation updates, production step visualization with item transformations


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
- `addItem(id, name, icon, basePrice, quantity, category, recipeId)` - Add item to store inventory
- `updateStoreDisplay()` - Refresh store interface with current inventory
- `updateStoreStats()` - Update revenue and inventory count displays
- `updateStoreInventory()` - Refresh inventory grids by category
- `updateStoreCategory(category)` - Update specific category display
- `getItem(itemId)` - Get specific store item details
- `getAllItems()` - Get all store items array
- `getItemsByCategory(category)` - Filter items by category (baked_goods/packages/ingredients)
- `getCurrentPrice(itemId)` - Get current market price with modifiers
- `getPriceModifiers(itemId)` - Get detailed pricing modifier breakdown
- `getInventoryValue()` - Calculate total inventory value
- `getTotalRevenue()` - Get total store revenue
- `getSalesStats(hours)` - Get sales statistics for timeframe
- `updateLocation(location)` - Change store location for pricing
- `showSalesNotification(message)` - Display sale success notification
- `showPricingInfoModal(itemId)` - Show detailed pricing breakdown modal

**Key HTML Elements and their Behaviors**
- `#location-select` - Dropdown that changes pricing modifiers for all items
- `#total-revenue, #items-in-stock, #store-value` - Live-updating stat displays
- `#baked-goods-grid, #packages-grid, #ingredients-grid` - Item category containers
- `store-item-card` - Custom Lit components with sell buttons and pricing info
- `.pricing-modifiers` - Percentage displays showing time/demand/location/freshness factors
- `#sales-notification` - Toast notification that appears briefly after successful sales

**Colors and Emoji Used**
- **Colors**: Green revenue/stats (#4caf50), blue location/pricing info (#007acc), red negative modifiers, green positive modifiers, orange pricing alerts
- **Emoji**: 🏪 (store), 📍 (location), 🧁 (baked goods), 📦 (packages), 🌾 (ingredients), sale success notifications
- **Visual States**: Live-updating financial displays, pricing modifier percentage indicators (+/-), category-organized inventory grids



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
- `buyIngredient(ingredientId, amount, price)` - Legacy purchase method
- `updateSupplierDisplay()` - Refresh supplier interface
- `populateSupplierItems()` - Populate supplier grid with available ingredients
- `createSupplierItemHTML()` - Generate supplier item card HTML
- `getSupplierIngredients()` - Get ingredients available for purchase
- `showPurchaseConfirmation()` - Display purchase success animation
- `calculateTotalCost(basePrice, quantity)` - Calculate total cost with bulk discounts
- `calculateSavings(basePrice, quantity)` - Calculate bulk discount savings
- `formatCurrency(amount)` - Format currency display consistently
- `calculateBulkPrice(basePrice, quantity)` - Calculate unit price with bulk discounts
- `validatePurchase(ingredientId, quantity, cost)` - Validate purchase legality
- `updateSupplierDisplay(stats, ingredients)` - Update supplier UI components
- `createSupplierItemHTML(ingredient, currentStock, availableCoins)` - Create item card with purchase options

**Key HTML Elements and their Behaviors**
- `#available-coins, #todays-orders, #bulk-savings` - Live-updating financial stat displays
- `.pricing-tier` - Visual pricing guides showing 1-unit, 10-pack, and 100-pack discounts
- `#supplier-items-grid` - Container populated with ingredient purchase cards
- `.supplier-item-card` - Cards with quantity options (1, 10, 100) and buy buttons
- `.quantity-option` - Buttons showing unit price and total cost that update available funds
- `.btn-purchase` - Buttons that become disabled when insufficient funds

**Colors and Emoji Used**  
- **Colors**: Green purchase buttons (#4caf50), red insufficient funds (#f44336), blue supplier interface (#007acc), yellow coin/pricing displays (#ffc107)
- **Emoji**: 🚚 (suppliers), 💰 (bulk pricing), 1️⃣🔟💯 (quantity tiers), 🥄 (ingredients catalog), ingredient-specific icons
- **Visual States**: Financial constraint-based button states, bulk discount visual tiers, live fund tracking, ingredient availability displays

