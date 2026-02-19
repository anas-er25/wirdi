import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function About() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.backText}>↩</Text>
        </Pressable>

        <Text style={styles.title}>من نحن</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          <Text style={styles.appName}>وردي</Text>

          <Text style={styles.paragraph}>
            تطبيق بسيط يهدف إلى مساعدتك على الالتزام بوردك اليومي من القرآن
            وأذكار الصباح والمساء بطريقة منظمة وسهلة.
          </Text>

          <Text style={styles.paragraph}>
            تم تصميم التطبيق ليكون خفيفًا، واضحًا، وخاليًا من التعقيد،
            مع تركيز كامل على تحسين التجربة الروحية خلال شهر رمضان.
          </Text>

          <Text style={styles.section}>رؤيتنا</Text>

          <Text style={styles.paragraph}>
            بناء أداة رقمية تعين المسلم على الثبات والاستمرارية
            في الذكر وقراءة القرآن، دون تشتيت أو إعلانات مزعجة.
          </Text>

          <Text style={styles.section}>الإصدار</Text>
          <Text style={styles.paragraph}>الإصدار 1.0.0</Text>

          <Text style={styles.section}>تواصل معنا</Text>
          <Text style={styles.paragraph}>
            يمكنك مراسلتنا عبر البريد الإلكتروني:
          </Text>

          <Text style={styles.email}>errakibiianas@gmail.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EDE1CF",
    padding: 20,
    paddingTop: 26,
  },

  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: "#9F5921",
    fontWeight: "900",
    fontSize: 18,
  },

  title: {
    flex: 1,
    textAlign: "right",
    fontSize: 22,
    fontWeight: "900",
    color: "#9F5921",
  },

  card: {
    backgroundColor: "#F6EBDD",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2CBB6",
  },

  appName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#9F5921",
    textAlign: "right",
    marginBottom: 12,
  },

  section: {
    fontSize: 16,
    fontWeight: "900",
    color: "#9F5921",
    textAlign: "right",
    marginTop: 18,
    marginBottom: 6,
  },

  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: "#7A4318",
    textAlign: "right",
  },

  email: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "900",
    color: "#9F5921",
    textAlign: "right",
  },
});
