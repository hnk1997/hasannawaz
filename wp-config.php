<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'hasannawaz_db' );

/** MySQL database username */
define( 'DB_USER', 'root' );

/** MySQL database password */
define( 'DB_PASSWORD', '' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '58k=7QZ2tPGI]+?Uz*8RB3=#k/E39t:{DOy&U?N[CDxlD/~@81Fh+$bEp3n#F0IP' );
define( 'SECURE_AUTH_KEY',  'BTI[-/Al@VM95~,!_C.4H%M$QtcTV%oAP(e{6]r59diWiN=B+y&Pa^K2uW^cp}-o' );
define( 'LOGGED_IN_KEY',    'L.30C/FE{z~,<iM|a(}x|$b%K_qn d*c_ `u(d21n-uB/U%~;cX ^A${}8w7PnoK' );
define( 'NONCE_KEY',        '_V%=Hii!eLBr@BVYF`P74;XfA`DE#qavq(u0y,E6`Dr}rkVF.k`JDlHpMKmgS^gI' );
define( 'AUTH_SALT',        'r;%jybXFh`J0T/&riUR`tzM6-rL[}f{uO30izG~O}>}Qi:ft8@HHs*t]YiH>I(o|' );
define( 'SECURE_AUTH_SALT', '{ND@b0E/w^e k4)Q`o[@Ui5ce{@dex.W58%fwz@KE^X-]Ze=fqVUM*)W[26yKcB*' );
define( 'LOGGED_IN_SALT',   ':KB;|1~zEmw$@wQKi{hR?@Ya2$X]#I,W@E_0~PLsXf0k%,AiaeXz;uwE?jk}=uxN' );
define( 'NONCE_SALT',       '6xEMfUgBK`yP*l,-%:*2(L2hX-=c-cSxD1@4N5!yX4?f$ EO*WvCpOa9emEt=t^0' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
