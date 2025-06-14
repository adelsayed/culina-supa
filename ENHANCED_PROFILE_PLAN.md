# Enhanced User Profile Implementation Plan

## 🎯 Overview
Enhance the user profile system to support personalized health data, nutrition goals, and AI-powered features for smart meal planning and recommendations.

## 📊 Enhanced Profile Data Structure

### 1. Health & Biometric Data
- **Age**: Used for BMR calculation and age-appropriate recommendations
- **Weight & Height**: For BMI calculation and calorie needs estimation
- **Gender**: Affects BMR calculation and nutritional requirements
- **Activity Level**: 5-tier system (sedentary to extremely active)

### 2. Health Goals & Targets
- **Weight Goal**: Maintain, lose, or gain weight
- **Target Weight**: Specific weight goal for tracking progress
- **Daily Calorie Target**: Calculated or manually set calorie goal
- **Macro Targets**: Protein, carbs, fat targets in grams

### 3. Dietary Preferences & Restrictions
- **Dietary Restrictions**: Vegetarian, vegan, keto, paleo, etc.
- **Allergies**: Nuts, shellfish, dairy, gluten, etc.
- **Disliked Ingredients**: Personal dislikes for better recommendations
- **Preferred Cuisines**: Italian, Mexican, Asian, Middle Eastern, etc.

### 4. AI Integration Settings
- **OpenAI API Key**: User's personal API key for AI features
- **AI Model Selection**: GPT-3.5, GPT-4, GPT-4-turbo options
- **Smart Features Toggles**: Enable/disable specific AI features

## 🛠 Implementation Components

### 1. Database Schema Updates ✅
- Enhanced UserProfile model in Amplify schema
- Added health data, goals, preferences, and AI settings fields
- Backward compatibility with existing profiles

### 2. UI Components to Build
#### A. Profile Overview Screen
- Health summary dashboard
- BMI calculation and display
- Goal progress tracking
- Quick stats (age, weight, activity level)

#### B. Health Data Section
- Biometric input forms (age, weight, height, gender)
- Activity level selector with descriptions
- Progress tracking charts

#### C. Goals & Targets Section
- Weight goal selection and target setting
- Calorie calculator with manual override
- Macro targets with visual sliders
- Goal timeline and progress tracking

#### D. Dietary Preferences Section
- Multi-select dietary restrictions
- Allergy management with severity levels
- Disliked ingredients list
- Cuisine preferences with visual cards

#### E. AI Settings Section
- API key management (secure input/display)
- Model selection with feature comparison
- Smart features toggle switches
- Usage tracking and limits

## 🚀 Implementation Phases

### Phase 1: Core Health Data (Week 1)
- Update Amplify schema ✅
- Build health data input forms
- Implement BMR/BMI calculations
- Create basic profile dashboard

### Phase 2: Goals & Tracking (Week 2)
- Goal setting interface
- Progress tracking system
- Calorie and macro calculators
- Basic goal dashboard

### Phase 3: Dietary Preferences (Week 3)
- Dietary restrictions management
- Allergy and dislike systems
- Cuisine preference selection
- Integration with recipe filtering

### Phase 4: AI Integration (Week 4)
- Secure API key management
- OpenAI service integration
- Smart meal planning features
- Personalized recommendations

## 🎯 Next Steps

1. **Review and approve** this enhanced profile plan
2. **Start Phase 1** with core health data implementation
3. **Update useUserProfile hook** to handle new fields
4. **Build health data input forms** and validation
5. **Implement calculation utilities** for BMR/BMI
6. **Create enhanced profile dashboard** UI

This plan provides a comprehensive roadmap for creating a personalized, AI-powered nutrition and meal planning experience in Culina!