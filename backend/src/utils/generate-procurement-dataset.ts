/**
 * generate-procurement-dataset.ts
 * Generates a realistic procurement CSV dataset with 500+ projects
 * derived from NREGA/Indian government procurement patterns.
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const states = [
  { state: 'Maharashtra', districts: ['Pune', 'Nashik', 'Aurangabad', 'Nagpur', 'Solapur', 'Kolhapur', 'Satara', 'Sangli', 'Ratnagiri', 'Amravati'] },
  { state: 'Rajasthan', districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Bikaner', 'Ajmer', 'Kota', 'Barmer', 'Sikar', 'Bharatpur', 'Alwar'] },
  { state: 'Madhya Pradesh', districts: ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Ratlam', 'Satna', 'Rewa', 'Chhindwara'] },
  { state: 'Odisha', districts: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Jeypore', 'Koraput'] },
  { state: 'Tamil Nadu', districts: ['Madurai', 'Chennai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode', 'Dindigul', 'Thanjavur'] },
  { state: 'Karnataka', districts: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Shivamogga', 'Tumakuru'] },
  { state: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Mehsana'] },
  { state: 'Uttar Pradesh', districts: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur'] },
  { state: 'Bihar', districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Samastipur'] },
  { state: 'West Bengal', districts: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Murshidabad', 'Burdwan', 'Jalpaiguri', 'Bankura'] },
  { state: 'Andhra Pradesh', districts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Ongole', 'Anantapur'] },
  { state: 'Telangana', districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Nalgonda', 'Mahabubnagar', 'Ranga Reddy', 'Medak', 'Adilabad'] },
  { state: 'Kerala', districts: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kottayam', 'Kannur'] },
  { state: 'Punjab', districts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Gurdaspur', 'Pathankot', 'Moga'] },
  { state: 'Haryana', districts: ['Gurgaon', 'Faridabad', 'Ambala', 'Hisar', 'Rohtak', 'Panipat', 'Karnal', 'Sonipat', 'Yamunanagar', 'Bhiwani'] },
  { state: 'Jharkhand', districts: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribag', 'Giridih', 'Ramgarh', 'Dumka', 'Pakur'] },
  { state: 'Chhattisgarh', districts: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Ambikapur', 'Jagdalpur', 'Raigarh', 'Kawardha'] },
  { state: 'Assam', districts: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Bongaigaon', 'Tezpur', 'Karimganj', 'Haflong'] },
  { state: 'Himachal Pradesh', districts: ['Shimla', 'Mandi', 'Dharamsala', 'Solan', 'Kullu', 'Bilaspur', 'Hamirpur', 'Una', 'Chamba', 'Kinnaur'] },
  { state: 'Uttarakhand', districts: ['Dehradun', 'Haridwar', 'Nainital', 'Roorkee', 'Rishikesh', 'Mussoorie', 'Almora', 'Pithoragarh', 'Champawat', 'Rudrapur'] },
];

const projectTypes = [
  { name: 'Rural Road Construction', min: 3000000, max: 25000000 },
  { name: 'Water Supply Pipeline Installation', min: 2500000, max: 20000000 },
  { name: 'Solar Street Lighting', min: 1500000, max: 8000000 },
  { name: 'Panchayat Community Hall', min: 5000000, max: 15000000 },
  { name: 'Primary Health Sub-Centre Construction', min: 4000000, max: 12000000 },
  { name: 'Government Primary School Renovation', min: 2000000, max: 9000000 },
  { name: 'Drainage and Sanitation Works', min: 1800000, max: 10000000 },
  { name: 'Irrigation Canal Construction', min: 5000000, max: 30000000 },
  { name: 'Rural Bridge Construction', min: 8000000, max: 45000000 },
  { name: 'Anganwadi Centre Construction', min: 1200000, max: 4500000 },
  { name: 'Gram Panchayat Office Renovation', min: 800000, max: 3500000 },
  { name: 'Borewell and Handpump Installation', min: 500000, max: 2500000 },
  { name: 'Solid Waste Management System', min: 3000000, max: 12000000 },
  { name: 'Rainwater Harvesting Structure', min: 1500000, max: 6000000 },
  { name: 'Rural Electrification Works', min: 2000000, max: 10000000 },
  { name: 'Fair Price Shop Construction', min: 600000, max: 2000000 },
  { name: 'PMGSY Road Upgradation', min: 10000000, max: 60000000 },
  { name: 'Check Dam Construction', min: 3000000, max: 18000000 },
  { name: 'Skill Development Training Centre', min: 4000000, max: 14000000 },
  { name: 'Cold Storage Facility', min: 6000000, max: 25000000 },
  { name: 'Public Toilet Block (SBMG)', min: 500000, max: 2500000 },
  { name: 'Community Pond Renovation', min: 1000000, max: 5000000 },
  { name: 'Cattle Shed and Veterinary Centre', min: 1500000, max: 6000000 },
  { name: 'Soil Conservation Works', min: 2000000, max: 8000000 },
  { name: 'Tribal Welfare Hostel Construction', min: 7000000, max: 20000000 },
];

const vendorPrefixes = [
  'ABC', 'XYZ', 'PQR', 'Apex', 'National', 'Sahyadri', 'Pandian', 'Island', 'Marwar',
  'BrightSun', 'Kalinga', 'Meenakshi', 'Krishna', 'Ganga', 'Vinayak', 'Ramesh',
  'Maharashtra', 'Rajasthan', 'Karnataka', 'Bengal', 'Andhra', 'Tamil', 'Gujarat',
  'Pioneer', 'Sunrise', 'Green', 'Blue', 'Royal', 'Premier', 'Elite', 'Sai', 'Om',
  'Shree', 'Jai', 'Shiva', 'Durga', 'Lakshmi', 'Saraswati', 'Ram', 'Krishna', 'Ganesh',
  'Ambika', 'Birla', 'Tata', 'Larsen', 'Shapoorji', 'Ahluwalia', 'Simplex', 'NCC',
  'Megha', 'KNR', 'Gayatri', 'AFCONS', 'IRB', 'J Kumar', 'Era', 'Pratap', 'Vimal',
];

const vendorSuffixes = [
  'Constructions', 'Builders', 'Infrastructure', 'Civil Works', 'Engineering',
  'Contractors', 'Projects', 'Construction Co', 'Infra Pvt Ltd', 'Associates',
  'Enterprises', 'Group', 'Corporation', 'Works', 'Services', 'Solutions',
  'Developers', 'Constructions Pvt Ltd', 'Engineering Ltd', 'Infra Ltd',
];

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

function randomElement<T>(arr: T[]): T {
  const el = arr[Math.floor(Math.random() * arr.length)];
  if (el === undefined) throw new Error('randomElement called on empty array');
  return el;
}

function generateVendorName(): string {
  return `${randomElement(vendorPrefixes)} ${randomElement(vendorSuffixes)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().replace('T', 'T').split('.')[0] + 'Z';
}

// Statuses are assigned inline per-row (winner=AWARDED, others=ACTIVE/SUBMITTED)

const lines: string[] = [
  'tender_id,project_name,vendor_name,bid_amount,estimated_amount,status,submission_date'
];

const baseDate = new Date('2024-01-01T00:00:00Z');
let tenderCounter = 1;

for (const stateInfo of states) {
  for (const district of stateInfo.districts) {
    const numProjects = randomBetween(3, 5);
    for (let p = 0; p < numProjects; p++) {
      const tenderId = `T${String(tenderCounter).padStart(3, '0')}`;
      const projectType = randomElement(projectTypes);
      const projectName = `${projectType.name} - ${district}`;
      const estimatedAmount = randomBetween(projectType.min, projectType.max);
      
      // Round to nearest 1000
      const roundedEstimated = Math.round(estimatedAmount / 1000) * 1000;
      
      // 2-4 bidders per tender
      const numBidders = randomBetween(2, 4);
      
      // Winner gets a bid slightly below or at estimate (within 5-15% below)
      const winnerBidAmount = Math.round(roundedEstimated * (0.85 + Math.random() * 0.10) / 1000) * 1000;
      const winnerStatus = 'AWARDED';
      const dayOffset = randomBetween(0, 300);
      const winnerDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const winnerVendor = generateVendorName();
      
      lines.push(`${tenderId},"${projectName}","${winnerVendor}",${winnerBidAmount},${roundedEstimated},${winnerStatus},${formatDate(winnerDate)}`);
      
      // Other bidders
      for (let b = 1; b < numBidders; b++) {
        const bidderBidAmount = Math.round(roundedEstimated * (0.88 + Math.random() * 0.25) / 1000) * 1000;
        const bidderStatus = randomBetween(0, 3) === 0 ? 'ACTIVE' : 'SUBMITTED';
        const bidderDate = new Date(winnerDate.getTime() + randomBetween(1, 5) * 24 * 60 * 60 * 1000);
        const bidderVendor = generateVendorName();
        
        lines.push(`${tenderId},"${projectName}","${bidderVendor}",${bidderBidAmount},${roundedEstimated},${bidderStatus},${formatDate(bidderDate)}`);
      }
      
      tenderCounter++;
    }
  }
}

const csvContent = lines.join('\n') + '\n';
const outputPath = join(__dirname, '../../../datasets/procurement_tenders.csv');
writeFileSync(outputPath, csvContent, 'utf-8');

// Count stats
const tenderIds = new Set<string>();
let totalBids = 0;
for (const line of lines.slice(1)) {
  const tid = line.split(',')[0] ?? '';
  if (!tid) continue;
  tenderIds.add(tid);
  totalBids++;
}

console.log(`✅ Generated procurement_tenders.csv`);
console.log(`   Total tenders: ${tenderIds.size}`);
console.log(`   Total bid rows: ${totalBids}`);
console.log(`   File: ${outputPath}`);
