import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

@Injectable()
export class GimpService {
  private readonly gimpPath =
    'C:\\Users\\Dell\\AppData\\Local\\Programs\\GIMP 3\\bin\\gimp-console-3.0.exe';
  private readonly pythonScriptPath =
    'C:/Users/Dell/AppData/Roaming/GIMP/3.0/plug-ins/export_layers';
  private readonly uploadsDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'psd',
  );
  private readonly outputBaseDir = path.join(process.cwd(), 'public', 'layers');

  async exportLayers(psdFileName: string, outputFolderName: string) {
    // Kiểm tra file PSD có tồn tại không
    const psdPath = path.join(this.uploadsDir, psdFileName);
    if (!fs.existsSync(psdPath)) {
      throw new NotFoundException(`File PSD không tồn tại: ${psdFileName}`);
    }

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(this.outputBaseDir, outputFolderName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert paths sang format phù hợp với GIMP (forward slashes)
    const psdPathFormatted = psdPath.replace(/\\/g, '/');
    const outputDirFormatted = outputDir.replace(/\\/g, '/');

    // Tạo batch commands
    const batchCommands = [
      `import sys; sys.path.append(r'${this.pythonScriptPath}'); import export_layers; export_layers.export_layers('${psdPathFormatted}', '${outputDirFormatted}')`,
      `from gi.repository import Gimp; Gimp.quit()`,
    ];

    console.log('Đang chạy GIMP...');

    return new Promise((resolve, reject) => {
      const args = [
        '-i',
        '--batch-interpreter=python-fu-eval',
        '-b',
        batchCommands[0],
        '-b',
        batchCommands[1],
        '--quit',
      ];

      console.log('Command:', this.gimpPath, args.join(' '));

      const gimpProcess = spawn(this.gimpPath, args, {
        windowsHide: true,
        timeout: 300000, // 5 phút
      });

      let stdout = '';
      let stderr = '';

      gimpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('GIMP stdout:', output);
      });

      gimpProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.log('GIMP stderr:', output);
      });

      gimpProcess.on('close', (code) => {
        console.log(`GIMP process đã kết thúc với code: ${code}`);

        // Đợi một chút để đảm bảo files đã được ghi xong
        setTimeout(() => {
          try {
            // --- PHẦN SỬA ĐỔI: Đọc metadata từ file JSON ---
            const metadataPath = path.join(outputDir, 'metadata.json');
            let metadataDetail = null;

            if (fs.existsSync(metadataPath)) {
              const rawData = fs.readFileSync(metadataPath, 'utf8');
              metadataDetail = JSON.parse(rawData);
            }
            // -----------------------------------------------

            // Đọc danh sách files đã tạo
            const exportedFiles = fs
              .readdirSync(outputDir)
              .filter((file) => file.endsWith('.png'))
              .map((file) => `/layers/${outputFolderName}/${file}`);

            if (exportedFiles.length === 0) {
              reject(
                new InternalServerErrorException({
                  success: false,
                  message: 'Không tách được layer nào',
                  stdout,
                  stderr,
                }),
              );
              return;
            }

            resolve({
              success: true,
              message: `Đã tách thành công ${exportedFiles.length} layers`,
              outputFolder: outputFolderName,
              files: exportedFiles,
              totalLayers: exportedFiles.length,
              // Dữ liệu quan trọng nhất ở đây: Trả về meta chi tiết từng layer
              metadata: metadataDetail,
            });
          } catch (error) {
            reject(
              new InternalServerErrorException({
                success: false,
                message: 'Lỗi khi đọc files đã tách',
                error: error.message,
              }),
            );
          }
        }, 1000);
      });

      gimpProcess.on('error', (error) => {
        console.error('Lỗi khi chạy GIMP:', error);
        reject(
          new InternalServerErrorException({
            success: false,
            message: 'Lỗi khi khởi động GIMP',
            error: error.message,
          }),
        );
      });

      // Timeout fallback
      setTimeout(() => {
        if (!gimpProcess.killed) {
          console.log('GIMP timeout, killing process...');
          gimpProcess.kill('SIGTERM');

          // Force kill nếu vẫn không chết
          setTimeout(() => {
            if (!gimpProcess.killed) {
              gimpProcess.kill('SIGKILL');
            }
          }, 5000);
        }
      }, 300000); // 5 phút
    });
  }
}
