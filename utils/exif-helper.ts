import exifr from 'exifr';

export const extractGeodata = async (file: File): Promise<{ lat: number; lng: number } | null> => {
  try {
    

    const options = {
      gps: true,
      tiff: false,
      exif: false,
      ifd1: false
    };

    
    const output = await exifr.parse(file, options);
    

    if (output?.latitude && output?.longitude) {
      

      return {
        lat: output.latitude,
        lng: output.longitude
      };
    }

    
    return null;

  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return null;
  }
};