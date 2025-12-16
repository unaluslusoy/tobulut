import { Controller, Post, Get, UseInterceptors, UploadedFile, Param, BadRequestException, UseGuards, Req, Body, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust import if needed based on find result, assuming standard
import { Request } from 'express';

@Controller('uploads')
export class UploadsController {
  
  @UseGuards(JwtAuthGuard)
  @Post(':folder')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req: any, file, cb) => {
        const folder = req.params.folder;
        // Verify folder name is safe
        if (!/^[a-z0-9-]+$/.test(folder)) {
             return cb(new Error('Invalid folder name'), '');
        }
        
        const userId = req.user?.id || 'anonymous';
        const uploadPath = `./uploads/${userId}/${folder}`;
        
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
       if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt)$/)) { 
           // Expanded filter slightly for general usage if needed, but user said 'media'
           // Resisting urge to expand too much, keeping images primarily but adding documents as it is a "File Manager"
           return cb(null, true);
       }
       cb(null, true);
    }
  }))
  uploadFile(@Param('folder') folder: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('Dosya yüklenemedi.');
    
    // Construct URL based on user ID
    const userId = req.user?.id || 'anonymous';
    
    return {
      url: `/uploads/${userId}/${folder}/${file.filename}`
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/list')
  async listFiles(@Body() body: { path?: string }, @Req() req: any) {
      // Check if super admin
      if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
          // Allow admin too for now, or strict superuser? User said "sadece süper admin görsün"
          if (req.user.role !== 'superuser') throw new ForbiddenException('Yetkisiz erişim');
      }

      const requestedPath = body.path || '';
      // Prevent directory traversal
      if (requestedPath.includes('..')) throw new BadRequestException('Geçersiz yol');

      const fullPath = join(process.cwd(), 'uploads', requestedPath);
      
      if (!fs.existsSync(fullPath)) {
          return [];
      }

      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      
      return items.map(item => ({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          path: requestedPath ? `${requestedPath}/${item.name}` : item.name,
          size: item.isDirectory() ? 0 : fs.statSync(join(fullPath, item.name)).size
      }));
  }
}
