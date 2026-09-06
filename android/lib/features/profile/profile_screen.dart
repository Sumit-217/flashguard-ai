import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/user_profile.dart';
import '../../providers/profile_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _aadhaarCtrl = TextEditingController();
  final _emergencyNameCtrl = TextEditingController();
  final _emergencyPhoneCtrl = TextEditingController();

  bool _editing = false;
  bool _seededFromProfile = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _aadhaarCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    super.dispose();
  }

  void _seedControllers(UserProfile profile) {
    if (_seededFromProfile) return;
    _nameCtrl.text = profile.name;
    _phoneCtrl.text = profile.phone;
    _aadhaarCtrl.text = profile.aadhaarNumber;
    _emergencyNameCtrl.text = profile.emergencyContactName;
    _emergencyPhoneCtrl.text = profile.emergencyContactPhone;
    _seededFromProfile = true;
    // Start straight in edit mode if there's nothing saved yet.
    _editing = !profile.isComplete;
  }

  Future<void> _save(ProfileProvider provider) async {
    if (!_formKey.currentState!.validate()) return;
    await provider.saveProfile(
      UserProfile(
        name: _nameCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        aadhaarNumber: _aadhaarCtrl.text.replaceAll(RegExp(r'\D'), ''),
        emergencyContactName: _emergencyNameCtrl.text.trim(),
        emergencyContactPhone: _emergencyPhoneCtrl.text.trim(),
      ),
    );
    if (!mounted) return;
    setState(() => _editing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profile saved on this device.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfileProvider>();

    if (!provider.isLoaded) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    _seedControllers(provider.profile);

    return Scaffold(
      appBar: AppBar(
        title: const Text('PROFILE'),
        actions: [
          if (!_editing)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => setState(() => _editing = true),
              tooltip: 'Edit',
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          _SosCard(provider: provider),
          const SizedBox(height: 16),
          _LocationSharingCard(provider: provider),
          const SizedBox(height: 16),
          _ProfileFormCard(
            formKey: _formKey,
            editing: _editing,
            nameCtrl: _nameCtrl,
            phoneCtrl: _phoneCtrl,
            aadhaarCtrl: _aadhaarCtrl,
            emergencyNameCtrl: _emergencyNameCtrl,
            emergencyPhoneCtrl: _emergencyPhoneCtrl,
            profile: provider.profile,
            onSave: () => _save(provider),
            onCancel: () {
              setState(() {
                _seededFromProfile = false;
                _editing = false;
                _seedControllers(provider.profile);
              });
            },
          ),
          const SizedBox(height: 16),
          const _PrivacyNote(),
        ],
      ),
    );
  }
}

class _SosCard extends StatelessWidget {
  final ProfileProvider provider;
  const _SosCard({required this.provider});

  Future<void> _confirmAndSend(BuildContext context) async {
    if (!provider.profile.isComplete) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add your name and phone number below before sending an SOS.'),
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceRaised,
        title: const Text('Send SOS?'),
        content: const Text(
          'This sends your name, phone, Aadhaar and current GPS location '
          'to the FlashGuard admin/rescue server right now.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('CANCEL')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.critical),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('SEND SOS'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await provider.sendHelpRequest();
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = provider.sosStatus;
    final color = switch (status) {
      SosStatus.sent => AppColors.low,
      SosStatus.failed => AppColors.critical,
      SosStatus.sending => AppColors.moderate,
      SosStatus.idle => AppColors.critical,
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'EMERGENCY',
            style: TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.8),
          ),
          const SizedBox(height: 10),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.critical,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
            ),
            onPressed: status == SosStatus.sending ? null : () => _confirmAndSend(context),
            icon: status == SosStatus.sending
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.emergency),
            label: Text(
              status == SosStatus.sending ? 'SENDING…' : 'ASK FOR HELP',
              style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.6),
            ),
          ),
          if (status == SosStatus.sent) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.check_circle, size: 14, color: color),
                const SizedBox(width: 6),
                const Text(
                  'Help request sent with your location.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ],
          if (status == SosStatus.failed) ...[
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.error_outline, size: 14, color: color),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    provider.sosError ?? 'Could not send the help request.',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _LocationSharingCard extends StatelessWidget {
  final ProfileProvider provider;
  const _LocationSharingCard({required this.provider});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'SHARE LIVE LOCATION',
                  style: TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.8),
                ),
              ),
              Switch(
                value: provider.isLocationSharingOn,
                onChanged: (v) => provider.setLocationSharing(v),
                activeColor: AppColors.accent,
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            provider.isLocationSharingOn
                ? 'Sending your name, phone, Aadhaar and GPS position to the '
                    'admin server every ${AdminApiConfig.locationPingInterval.inSeconds}s '
                    'while this app is open.'
                : 'Off by default. Turn on to continuously share your location '
                    'with the rescue/admin team while the app is open.',
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
          ),
          if (provider.isLocationSharingOn) ...[
            const SizedBox(height: 10),
            if (provider.pingError != null)
              Row(
                children: [
                  const Icon(Icons.error_outline, size: 14, color: AppColors.critical),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      provider.pingError!,
                      style: AppTheme.numeric(fontSize: 11, color: AppColors.critical),
                    ),
                  ),
                ],
              )
            else if (provider.lastPingAt != null)
              Row(
                children: [
                  const Icon(Icons.gps_fixed, size: 14, color: AppColors.low),
                  const SizedBox(width: 6),
                  Text(
                    'Last ping ${provider.lastPingAt!.toLocal().toIso8601String().substring(11, 19)}',
                    style: AppTheme.numeric(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
          ],
          if (!AdminApiConfig.isConfigured) ...[
            const SizedBox(height: 10),
            const Text(
              'Admin server URL not set yet — pings will fail until '
              'AdminApiConfig.baseUrl is configured.',
              style: TextStyle(fontSize: 11, color: AppColors.moderate),
            ),
          ],
        ],
      ),
    );
  }
}

class _ProfileFormCard extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final bool editing;
  final TextEditingController nameCtrl;
  final TextEditingController phoneCtrl;
  final TextEditingController aadhaarCtrl;
  final TextEditingController emergencyNameCtrl;
  final TextEditingController emergencyPhoneCtrl;
  final UserProfile profile;
  final VoidCallback onSave;
  final VoidCallback onCancel;

  const _ProfileFormCard({
    required this.formKey,
    required this.editing,
    required this.nameCtrl,
    required this.phoneCtrl,
    required this.aadhaarCtrl,
    required this.emergencyNameCtrl,
    required this.emergencyPhoneCtrl,
    required this.profile,
    required this.onSave,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(3),
      ),
      child: editing ? _buildForm(context) : _buildReadOnly(),
    );
  }

  Widget _buildReadOnly() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'YOUR INFO',
          style: TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.8),
        ),
        const SizedBox(height: 12),
        _ReadOnlyRow(label: 'Name', value: profile.name.isEmpty ? '—' : profile.name),
        _ReadOnlyRow(label: 'Phone', value: profile.phone.isEmpty ? '—' : profile.phone),
        _ReadOnlyRow(label: 'Aadhaar', value: profile.maskedAadhaar),
        const Divider(height: 24, color: AppColors.hairline),
        _ReadOnlyRow(
          label: 'Emergency contact',
          value: profile.emergencyContactName.isEmpty ? '—' : profile.emergencyContactName,
        ),
        _ReadOnlyRow(
          label: 'Emergency phone',
          value: profile.emergencyContactPhone.isEmpty ? '—' : profile.emergencyContactPhone,
        ),
      ],
    );
  }

  Widget _buildForm(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'YOUR INFO',
            style: TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.8),
          ),
          const SizedBox(height: 12),
          _FormField(
            label: 'Full name',
            controller: nameCtrl,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
          _FormField(
            label: 'Phone number',
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            validator: (v) {
              final digits = (v ?? '').replaceAll(RegExp(r'\D'), '');
              if (digits.length < 10) return 'Enter a valid phone number';
              return null;
            },
          ),
          _FormField(
            label: 'Aadhaar number (12 digits)',
            controller: aadhaarCtrl,
            keyboardType: TextInputType.number,
            validator: (v) {
              final digits = (v ?? '').replaceAll(RegExp(r'\D'), '');
              if (digits.isEmpty) return null; // optional
              if (digits.length != 12) return 'Aadhaar must be 12 digits';
              return null;
            },
          ),
          const Divider(height: 28, color: AppColors.hairline),
          _FormField(label: 'Emergency contact name', controller: emergencyNameCtrl),
          _FormField(
            label: 'Emergency contact phone',
            controller: emergencyPhoneCtrl,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onCancel,
                  child: const Text('CANCEL'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: onSave,
                  child: const Text('SAVE'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _FormField({
    required this.label,
    required this.controller,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        style: const TextStyle(color: AppColors.textPrimary),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: AppColors.textMuted),
          isDense: true,
          border: const OutlineInputBorder(),
          enabledBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: AppColors.hairline),
          ),
          focusedBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: AppColors.accent),
          ),
        ),
      ),
    );
  }
}

class _ReadOnlyRow extends StatelessWidget {
  final String label;
  final String value;
  const _ReadOnlyRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 13.5, color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }
}

class _PrivacyNote extends StatelessWidget {
  const _PrivacyNote();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'Your Aadhaar number is stored only on this device (encrypted) and is '
      'only transmitted when you press "Ask for help" or turn on live '
      'location sharing above.',
      style: TextStyle(fontSize: 10.5, color: AppColors.textMuted, height: 1.4),
    );
  }
}
