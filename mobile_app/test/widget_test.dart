import 'package:flutter_test/flutter_test.dart';
import 'package:omniflow_agent/main.dart';

void main() {
  testWidgets('OmniFlowAgentApp builds cleanly', (WidgetTester tester) async {
    await tester.pumpWidget(const OmniFlowAgentApp());
    expect(find.byType(OmniFlowAgentApp), findsOneWidget);
    // Allow splash timer to complete
    await tester.pump(const Duration(seconds: 2));
  });
}
