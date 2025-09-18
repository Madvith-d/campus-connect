import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image, X, TestTube } from 'lucide-react';
import { testStorageBucket, testImageUpload, checkBucketConfig, testSimpleUpload, testWithRealImage } from '@/lib/storage-test';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

const CreateEventDialog = ({ isOpen, onClose, onEventCreated }: CreateEventDialogProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userClubs, setUserClubs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    capacity: 50,
    is_team_event: false,
    event_image_url: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch clubs where user is admin
  useEffect(() => {
    const fetchUserClubs = async () => {
      if (!profile) return;

      try {
        let clubs = [];
        
        if (profile.role === 'college_admin') {
          // College admins can create events for any club
          const { data, error } = await supabase
            .from('clubs')
            .select('id, name')
            .eq('approved', true)
            .order('name');
            
          if (error) throw error;
          clubs = data || [];
        } else if (profile.role === 'club_admin') {
          // Club admins can only create events for clubs they admin
          const { data, error } = await supabase
            .from('club_members')
            .select(`
              clubs (id, name)
            `)
            .eq('profile_id', profile.user_id)
            .eq('role', 'admin');

          if (error) throw error;
          clubs = data?.map(item => item.clubs).filter(Boolean) || [];
        }
        
        setUserClubs(clubs);
        if (clubs.length > 0) {
          setSelectedClubId(clubs[0].id);
        }
      } catch (error) {
        console.error('Error fetching user clubs:', error);
      }
    };

    if (isOpen) {
      fetchUserClubs();
    }
  }, [isOpen, profile]);

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        toast({
          title: "Invalid file type",
          description: `Please select an image file. Got: ${file.type}`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      console.log('File validation passed, ready for upload');
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Generate unique filename with proper extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `event-posters/${fileName}`;

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath
      });

      // Upload the file directly without conversion to avoid MIME type issues
      // The File object already has the correct MIME type
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      console.log('Upload successful:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Test storage functionality
  const testStorage = async () => {
    try {
      console.log('=== STARTING STORAGE TEST ===');
      
      // First, check bucket configuration
      console.log('Step 1: Checking bucket configuration...');
      const configCheck = await checkBucketConfig();
      
      if (!configCheck) {
        toast({
          title: "Configuration check failed",
          description: "Unable to verify bucket configuration",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Configuration check results:', configCheck);
      
      // Then test bucket access
      console.log('Step 2: Testing storage bucket access...');
      const bucketTest = await testStorageBucket();
      
      if (bucketTest) {
        console.log('Step 3: Testing simple file upload...');
        const simpleTest = await testSimpleUpload();
        
        if (simpleTest) {
          console.log('Step 4: Testing real image upload...');
          const realImageTest = await testWithRealImage();
          
          if (realImageTest) {
            console.log('Step 5: Testing generated image upload...');
            const imageTest = await testImageUpload();
            
            toast({
              title: "Storage test completed",
              description: `Config: ${configCheck.bucketExists ? 'OK' : 'FAIL'}, Bucket: ${bucketTest ? 'OK' : 'FAIL'}, Simple: ${simpleTest ? 'OK' : 'FAIL'}, Real: ${realImageTest ? 'OK' : 'FAIL'}, Generated: ${imageTest ? 'OK' : 'FAIL'}`,
              variant: configCheck.bucketExists && bucketTest && simpleTest && realImageTest && imageTest ? 'default' : 'destructive',
            });
          } else {
            toast({
              title: "Storage test failed",
              description: `Bucket exists: ${configCheck.bucketExists ? 'YES' : 'NO'}, Access: ${bucketTest ? 'OK' : 'FAIL'}, Simple: ${simpleTest ? 'OK' : 'FAIL'}, Real Image: FAIL`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Storage test failed",
            description: `Bucket exists: ${configCheck.bucketExists ? 'YES' : 'NO'}, Access: ${bucketTest ? 'OK' : 'FAIL'}, Simple Upload: FAIL`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Storage test failed",
          description: `Bucket exists: ${configCheck.bucketExists ? 'YES' : 'NO'}, Access: FAIL`,
          variant: "destructive",
        });
      }
      
      console.log('=== STORAGE TEST COMPLETED ===');
    } catch (error) {
      console.error('Storage test error:', error);
      toast({
        title: "Storage test failed",
        description: "Check console for detailed error information",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClubId) return;

    // Validate dates
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    
    if (startDate >= endDate) {
      toast({
        title: "Invalid dates",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.event_image_url;

      // Upload image if one is selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          toast({
            title: "Error uploading image",
            description: "Failed to upload the event poster. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          start_time: formData.start_time,
          end_time: formData.end_time,
          capacity: formData.capacity,
          is_team_event: formData.is_team_event,
          club_id: selectedClubId,
          created_by: user.id,
          event_image_url: imageUrl,
        });

      if (error) {
        toast({
          title: "Error creating event",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Event created successfully",
        description: "Your event has been created and is now available for registration.",
      });

      setFormData({
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        capacity: 50,
        is_team_event: false,
        event_image_url: '',
      });
      setSelectedImage(null);
      setImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
      onEventCreated?.();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create an event for your club members and students.
          </DialogDescription>
        </DialogHeader>
        
        {userClubs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {profile?.role === 'college_admin' 
                ? 'No approved clubs available.'
                : 'You need to be a club admin to create events.'
              }
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club">Select Club</Label>
              <select
                id="club"
                className="w-full p-2 border rounded-md"
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                required
              >
                {userClubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event"
                rows={3}
              />
            </div>

            {/* Event Poster Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="event_poster">Event Poster (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testStorage}
                  className="text-xs"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Storage
                </Button>
              </div>
              <div className="space-y-3">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="event_poster"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Poster Image
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG up to 5MB. Will be used to generate gradient backgrounds.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Event poster preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Poster uploaded. Gradient will be generated automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_team_event"
                checked={formData.is_team_event}
                onCheckedChange={(checked) => setFormData({ ...formData, is_team_event: checked })}
              />
              <Label htmlFor="is_team_event">Team Event (requires team registration)</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isUploadingImage}>
                {(loading || isUploadingImage) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploadingImage ? 'Uploading...' : 'Create Event'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;