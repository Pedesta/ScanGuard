'use client';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import WordCloud from 'react-wordcloud';
import { useVisitorStore } from '@/store/visitor-store';
import { Visitor } from '@/types';

export default function Dashboard(): JSX.Element {
  const visitors = useVisitorStore((state) => state.visitors);

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!visitors.length) return {
      totalVisitors: 0,
      averageStay: '0 mins',
      peakHours: '---',
      weeklyData: [],
      combinedWordCloud: []
    };

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Filter visitors for the last 30 days
    const recentVisitors = visitors.filter(visitor => 
      new Date(visitor.checkin) >= thirtyDaysAgo
    );

    // Calculate total visitors in the last 30 days
    const totalVisitors = recentVisitors.length;

    // Calculate average stay in the last 30 days
    const completedVisits = recentVisitors.filter(visitor => visitor.checkin && visitor.checkout);
    const averageStayInMs = completedVisits.length ? 
      completedVisits.reduce((acc, visitor) => {
        try {
          const checkoutTime = new Date(visitor.checkout);
          const checkinTime = new Date(visitor.checkin);
          
          if (isNaN(checkinTime.getTime()) || isNaN(checkoutTime.getTime())) return acc;
          
          const durationMs = checkoutTime.getTime() - checkinTime.getTime();
          
          // Only add if duration is positive
          return acc + (durationMs > 0 ? durationMs : 0);
        } catch (error) {
          console.error('Error calculating stay duration:', error);
          return acc;
        }
      }, 0) / completedVisits.length : 0;

    // Format the average stay
    const formatDuration = (durationMs: number): string => {
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMs / (1000 * 60 * 60);
      const durationDays = durationMs / (1000 * 60 * 60 * 24);

      if (durationDays >= 1) {
        return `${durationDays.toFixed(1)} days`;
      } else if (durationHours >= 1) {
        return `${durationHours.toFixed(1)} hrs`;
      } else {
        return `${Math.round(durationMinutes)} mins`;
      }
    };

    const averageStayFormatted = formatDuration(averageStayInMs);

    // Calculate peak hours in the last 30 days
    const hourCounts: { [key: string]: number } = {};
    recentVisitors.forEach(visitor => {
      const hour = new Date(visitor.checkin).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    const peakHourFormatted = peakHour ? 
      `${peakHour}-${(parseInt(peakHour) + 1).toString().padStart(2, '0')}` : 
      '---';

    // Helper function to tokenize and filter words from sentences
    const tokenize = (sentence: string): string[] => {
      // Convert the sentence to lowercase and remove punctuation
      const cleanedSentence = sentence.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
      
      // Split by spaces to get individual words
      const words = cleanedSentence.split(/\s+/);

      // Define a list of stop words to ignore
      const stopWords = new Set([
        'a', 'the', 'and', 'is', 'in', 'it', 'to', 'of', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'an', 'that', 'this'
      ]);

      // Filter out stop words and return the remaining words
      return words.filter(word => !stopWords.has(word) && word.length > 1);
    };

    // Function to generate combined word cloud data by breaking down sentences into words
    const generateCombinedWordCloudData = () => {
      const wordCounts: { [key: string]: number } = {};

      ['purpose', 'whereFrom', 'whereTo'].forEach(field => {
        recentVisitors.forEach(visitor => {
          const value = visitor[field as keyof Visitor] as string;
          if (value) {
            const words = tokenize(value);
            words.forEach(word => {
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
          }
        });
      });

      return Object.entries(wordCounts).map(([text, value]) => ({
        text,
        value
      }));
    };

    const combinedWordCloud = generateCombinedWordCloudData();

    // Calculate weekly data for the past 30 days
    const getWeeklyAnalytics = (visitors: Visitor[]) => {
      // Initialize counts for each day of the week
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayCounts = dayNames.map(day => ({
        name: day,
        average: 0,
      }));

      // Count visits by day of the week for the last 30 days
      const dayTotals = new Array(7).fill(0);
      const weeksCount = new Array(7).fill(0);

      visitors.forEach(visitor => {
        const visitDay = new Date(visitor.checkin).getDay();
        const adjustedDay = visitDay === 0 ? 6 : visitDay - 1; // Convert to Monday=0 format
        dayTotals[adjustedDay]++;

        // Count the number of each weekday in the 30-day period
        weeksCount[adjustedDay]++;
      });

      // Calculate averages
      dayTotals.forEach((total, index) => {
        // Calculate weeks for this day in the 30-day period
        const weeksForThisDay = Math.ceil(weeksCount[index] / 7); // Approximately weeks in the 30-day period
        dayCounts[index].average = weeksForThisDay ? 
          Number((total / weeksForThisDay).toFixed(1)) : 0;
      });

      return dayCounts;
    };

    return {
      totalVisitors,
      averageStay: averageStayFormatted,
      peakHours: peakHourFormatted,
      weeklyData: getWeeklyAnalytics(recentVisitors),
      combinedWordCloud
    };
  }, [visitors]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Visitors (Last 30 Days)</h3>
          <p className="text-3xl font-bold">{analytics.totalVisitors.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Average Stay (Last 30 Days)</h3>
          <p className="text-3xl font-bold">{analytics.averageStay}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Peak Hours (Last 30 Days)</h3>
          <p className="text-3xl font-bold">{analytics.peakHours}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Average Visits by Day of Week (Last 30 Days)</h3>
        <div className="text-sm text-gray-500 mb-4">
          Showing the average number of visits per day over the past 30 days.
        </div>
        <div className="w-full overflow-x-auto">
          <BarChart 
            width={800} 
            height={300} 
            data={analytics.weeklyData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => {
                return [value, '30-Day Average'];
              }}
            />
            <Legend />
            <Bar 
              dataKey="average" 
              fill="#8884d8" 
              name="30-Day Average"
            />
          </BarChart>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-0">Word Cloud</h3>
      <p className='mt-0 italic text-sm text-gray-400 leading'>purpose, where from and to</p>
        <WordCloud words={analytics.combinedWordCloud} options={{ rotations: 2, rotationAngles: [-90, 0], fontSizes: [10, 60] }} />
      </div>
    </div>
  );
}
