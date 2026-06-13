import { ScrollView, View, Text, StyleSheet } from "react-native";

// Import your components here
// import MyComponent from './src/MyComponent';

export default function App() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Exam Components</Text>
      {/* Render your components below */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});
