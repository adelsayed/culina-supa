import { SafeAreaView } from 'react-native-safe-area-context';
import SignUpScreen from '../../screens/SignUpScreen';

export default function SignUpPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SignUpScreen />
    </SafeAreaView>
  );
}
