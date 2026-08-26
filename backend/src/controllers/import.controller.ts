import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { AppError } from '@/utils/app-error';
import { importService } from '@/services/import.service';

export const importController = {
  importCsv: asyncHandler(async (req: Request, res: Response) => {
    const uploadedFile = req.file;
    const csvText = typeof req.body.csvText === 'string' ? req.body.csvText : undefined;

    if (!uploadedFile && !csvText) {
      throw new AppError('CSV file or csvText payload is required', 400);
    }

    const projects = uploadedFile ? await importService.importFromCsv(uploadedFile.buffer.toString('utf8')) : await importService.importFromCsv(csvText as string);
    res.status(201).json({ message: 'Dataset imported', data: projects, count: projects.length });
  }),
};
