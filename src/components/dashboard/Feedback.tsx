
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const Feedback: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = React.useState([5]);
  const [category, setCategory] = React.useState('');
  const [comment, setComment] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Feedback submitted",
      description: "Thank you for your feedback!",
    });
    
    // Reset form
    setRating([5]);
    setCategory('');
    setComment('');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{t('nav.feedback')}</h2>
        <p className="text-muted-foreground">Share your experience and help us improve</p>
      </div>
      
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food Quality</SelectItem>
                  <SelectItem value="cleanliness">Cleanliness</SelectItem>
                  <SelectItem value="ac">Air Conditioning</SelectItem>
                  <SelectItem value="wait">Wait Time</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Rating ({rating})</Label>
              <Slider
                value={rating}
                min={1}
                max={10}
                step={1}
                onValueChange={setRating}
                className="py-4"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comment">Comments</Label>
              <Textarea 
                id="comment"
                placeholder="Please share your experience or suggestions..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-mintGreen hover:bg-mintGreen/90 text-navy"
            >
              {t('buttons.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
