import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthScreen from '../../screens/AuthScreen';

export default function SignInScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthScreen />
    </SafeAreaView>
  );
}
