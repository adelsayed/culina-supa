import { SafeAreaView } from 'react-native-safe-area-context';
import MyRecipesWithAmplify from '../../screens/MyRecipesWithAmplify';

export default function RecipesScreen() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <MyRecipesWithAmplify />
    </SafeAreaView>
  );
}
