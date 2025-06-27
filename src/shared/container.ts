import 'reflect-metadata';
import { Container } from 'inversify';
import { SceneManager } from '@/core/engine/SceneManager';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { MultiplicationService } from '@/core/math/MultiplicationService';

const container = new Container();

// Core services
container.bind<SceneManager>(SceneManager).toSelf().inSingletonScope();
container.bind<MultiplicationService>(MultiplicationService).toSelf().inSingletonScope();

// Presentation components
container.bind<CubeGrid>(CubeGrid).toSelf().inTransientScope();

export { container };