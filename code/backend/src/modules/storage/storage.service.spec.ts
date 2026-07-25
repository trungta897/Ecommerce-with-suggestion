import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn(),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
      },
    },
  };
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call delete without throwing', async () => {
    await expect(
      service.deleteFile('test-bucket', 'test-key.jpg'),
    ).resolves.not.toThrow();
  });
});
