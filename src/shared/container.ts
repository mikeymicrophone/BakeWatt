import 'reflect-metadata';
import { Container } from 'inversify';
import { SceneManager } from '@/core/engine/SceneManager';
import { CameraZoomManager } from '@/core/engine/CameraZoomManager';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { GestureHandler } from '@/presentation/ui/GestureHandler';
import { MultiplicationService } from '@/core/math/MultiplicationService';
import { MathService } from '@/core/math/MathService';
import { IngredientService } from '@/domain/inventory';
import { RecipeService } from '@/domain/baking';
import { RecipeScalingScene } from '@/presentation/scenes/RecipeScalingScene';
import { SubtractionMathScene } from '@/presentation/scenes/SubtractionMathScene';

const container = new Container();

// Core services
container.bind<SceneManager>(SceneManager).toSelf().inSingletonScope();
container.bind<CameraZoomManager>(CameraZoomManager).toSelf().inSingletonScope();
container.bind<MultiplicationService>(MultiplicationService).toSelf().inSingletonScope();
container.bind<MathService>(MathService).toSelf().inSingletonScope();

// Domain services
container.bind<IngredientService>(IngredientService).toSelf().inSingletonScope();
container.bind<RecipeService>(RecipeService).toSelf().inSingletonScope();

// Presentation components
container.bind<CubeGrid>(CubeGrid).toSelf().inTransientScope();
container.bind<GestureHandler>(GestureHandler).toSelf().inSingletonScope();
container.bind<RecipeScalingScene>(RecipeScalingScene).toSelf().inSingletonScope();
container.bind<SubtractionMathScene>(SubtractionMathScene).toSelf().inSingletonScope();

export { container };