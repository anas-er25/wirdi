import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Terms() {
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

        <Text style={styles.title}>شروط الاستخدام</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          <Text style={styles.section}>1. القبول بالشروط</Text>
          <Text style={styles.paragraph}>
            باستخدامك لتطبيق "وردي"، فإنك توافق على الالتزام بهذه الشروط
            والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام التطبيق.
          </Text>

          <Text style={styles.section}>2. استخدام التطبيق</Text>
          <Text style={styles.paragraph}>
            التطبيق مخصص للاستخدام الشخصي فقط بهدف تنظيم الورد
            اليومي والأذكار. يُمنع استخدامه لأي غرض غير قانوني أو مسيء.
          </Text>

          <Text style={styles.section}>3. المحتوى</Text>
          <Text style={styles.paragraph}>
            يتم توفير الأذكار والنصوص لأغراض دينية وتعليمية.
            لا يتحمل المطور أي مسؤولية عن أخطاء غير مقصودة في النصوص.
          </Text>

          <Text style={styles.section}>4. الخصوصية</Text>
          <Text style={styles.paragraph}>
            التطبيق لا يجمع بيانات شخصية حساسة. جميع البيانات
            المخزنة (مثل التقدم والعدادات) يتم حفظها محليًا على جهاز المستخدم.
          </Text>

          <Text style={styles.section}>5. التعديلات</Text>
          <Text style={styles.paragraph}>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت.
            استمرارك في استخدام التطبيق بعد التحديث يعني موافقتك على التعديلات.
          </Text>

          <Text style={styles.section}>6. إخلاء المسؤولية</Text>
          <Text style={styles.paragraph}>
            يتم تقديم التطبيق "كما هو" دون أي ضمانات صريحة أو ضمنية.
          </Text>

          <Text style={styles.section}>الإصدار</Text>
          <Text style={styles.paragraph}>آخر تحديث: 2026</Text>
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

  section: {
    fontSize: 16,
    fontWeight: "900",
    color: "#9F5921",
    textAlign: "right",
    marginTop: 16,
    marginBottom: 6,
  },

  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: "#7A4318",
    textAlign: "right",
  },
});
