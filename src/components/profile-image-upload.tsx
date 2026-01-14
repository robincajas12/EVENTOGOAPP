'use client';

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageSelected: (base64Image: string) => void;
}

export function ProfileImageUpload({ currentImage, onImageSelected }: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentImage);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onImageSelected(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
      <h3 className="text-base font-bold text-white">Foto de Perfil</h3>
      <Avatar className="w-24 h-24">
        <AvatarImage src={preview} alt="Profile" />
        <AvatarFallback className="text-2xl">YO</AvatarFallback>
      </Avatar>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="picture" className="text-gray-300 font-bold">Cambiar foto</Label>
        <Input 
          id="picture" 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="text-white file:text-black file:bg-yellow-500 file:hover:bg-yellow-400 file:border-none file:rounded-full file:px-4 file:py-2 file:mr-4 hover:cursor-pointer bg-[#1a1a1a] border border-gray-700 rounded-md"
        />
      </div>
    </div>
  );
}