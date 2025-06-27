import 'reflect-metadata';
import { Container } from 'inversify';
import { SceneManager } from '@/core/engine/SceneManager';
import { CameraZoomManager } from '@/core/engine/CameraZoomManager';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { GestureHandler } from '@/presentation/ui/GestureHandler';
import { MultiplicationService } from '@/core/math/MultiplicationService';

const container = new Container();

// Core services
container.bind<SceneManager>(SceneManager).toSelf().inSingletonScope();
container.bind<CameraZoomManager>(CameraZoomManager).toSelf().inSingletonScope();
container.bind<MultiplicationService>(MultiplicationService).toSelf().inSingletonScope();

// Presentation components
container.bind<CubeGrid>(CubeGrid).toSelf().inTransientScope();
container.bind<GestureHandler>(GestureHandler).toSelf().inSingletonScope();

export { container };