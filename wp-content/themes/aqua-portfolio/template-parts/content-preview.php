<?php
/**
 * Template part for displaying posts
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package @package Aqua Portfolio
 */

 	if ( has_post_thumbnail() ) { 
	$thumb = get_the_post_thumbnail_url(get_the_id(),'full'); 
	 } else { 
	 $thumb = esc_url( get_template_directory_uri() ) .'/img/default-image.jpg';

	} 

?>

<figure id="post-<?php the_ID(); ?>" class="all col-1-1 grid-item portfolio-item apdiv" style="background-image:url('<?php echo esc_url($thumb); ?>');">

<div class="bg">
  <figcaption>
    
    	<?php the_title( '<h3 class="entry-title"><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h3>' );

    		echo esc_html(aqua_portfolio_category()); 
			echo esc_html(do_action('pro-portfolio-type'));
			?>
  </figcaption>

</div>
</figure><!-- #post-## -->

