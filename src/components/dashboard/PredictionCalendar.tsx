
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ForecastData {
  date: string;
  recommended_quantity_to_prepare: number;
}

interface PredictionCalendarProps {
  forecastData: ForecastData[];
  dishName: string;
}

const PredictionCalendar: React.FC<PredictionCalendarProps> = ({ forecastData, dishName }) => {
  const { t } = useTranslation();

  const getCalendarDates = () => {
    return forecastData.map(item => new Date(item.date));
  };

  const getQuantityForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const forecast = forecastData.find(item => item.date === dateStr);
    return forecast ? forecast.recommended_quantity_to_prepare : null;
  };

  const calendarDates = getCalendarDates();

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Calendar
          mode="multiple"
          selected={calendarDates}
          className="rounded-md border bg-background"
          modifiers={{
            prediction: calendarDates
          }}
          modifiersStyles={{
            prediction: { 
              backgroundColor: '#4ECCA3', 
              color: '#222F2B',
              fontWeight: 'bold'
            }
          }}
          components={{
            Day: ({ date, ...props }) => {
              const quantity = getQuantityForDate(date);
              if (quantity !== null) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button {...props} className="relative w-9 h-9 p-0 font-normal aria-selected:opacity-100 bg-mintGreen text-navy font-bold rounded-md hover:bg-mintGreen/80 transition-colors">
                        {date.getDate()}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-semibold">{dishName}</p>
                        <p className="text-sm">{date.toLocaleDateString()}</p>
                        <p className="text-sm font-bold text-mintGreen">{quantity.toFixed(2)} units recommended</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <button {...props}>{date.getDate()}</button>;
            }
          }}
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {t('predictions.calendarDesc', { dish: dishName })}
      </p>
    </div>
  );
};

export default PredictionCalendar;
