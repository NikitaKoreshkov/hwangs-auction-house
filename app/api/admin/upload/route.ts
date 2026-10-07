import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s/g, '-');
    const fileName = `${timestamp}-${originalName}`;
    
    // Определяем директорию по типу файла
    let directory = 'uploads';
    if (file.type.startsWith('image/')) {
      directory = 'uploads/images';
    } else if (file.type === 'application/pdf') {
      directory = 'uploads/documents';
    } else if (file.type.startsWith('video/')) {
      directory = 'uploads/videos';
    }

    const publicPath = join(process.cwd(), 'public', directory);
    
    // Создаем директорию если не существует
    try {
      await mkdir(publicPath, { recursive: true });
    } catch (err) {
      // Директория уже существует
    }

    const filePath = join(publicPath, fileName);
    await writeFile(filePath, buffer);

    // Возвращаем публичный URL
    const publicUrl = `/${directory}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
  }
}

